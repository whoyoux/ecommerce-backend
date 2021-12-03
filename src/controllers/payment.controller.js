const stripe = require('stripe')(process.env.STRIPE_KEY);

const {
    getProductsById,
    updateQuantityProduct,
    removeProductQuantityByName
} = require('../controllers/products.controller.js');

const checkCoupon = async (couponId) => {
    try {
        return await stripe.coupons.retrieve(couponId);
    } catch (err) {
        return { err: true, errMessage: err };
    }
};

const sumOfOrder = (order) => {
    //TODO: Add cost of shipping
    let sum = 0;
    order.forEach((item) => {
        sum += (item.amount / 100) * item.quantity;
    });
    return sum;
};

const checkout = async (req, res) => {
    try {
        const productsFromDB = await getProductsById(req.body.order);

        if (productsFromDB.error) {
            console.log(productsFromDB.errorMessage);
            return res
                .status(404)
                .send({ error: true, errorMessage: productsFromDB.message });
        }

        const order = [];

        for (const product of productsFromDB) {
            const foundQuantity = req.body.order.find(
                (item) => item._id == product._id
            ).quantity;

            if (product.inStock == 0 && product.inStock < 0) {
                res.status(402).send({
                    error: true,
                    errMessage:
                        'Product quantity is more than product is in stock!'
                });
                break;
            }

            if (foundQuantity > product.inStock) {
                //TODO: Improve
                res.status(402).send({
                    error: true,
                    errMessage:
                        'Product quantity is more than product is in stock!'
                });
                break;
            }

            order.push({
                name: product.name,
                amount: parseFloat(product.amount) * 100,
                quantity: foundQuantity,
                currency: 'PLN'
            });
        }

        if (sumOfOrder(order) > 999999) {
            return res.status(401).send({
                error: true,
                errorMessage: "Order value can't be more than 999,999!"
            });
        }

        let sessionData = {
            success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/payment/failed`,
            payment_method_types: ['card'],
            line_items: order,
            mode: 'payment',
            //shipping_rates: ['shr_1IzJa1DmuEVpCSVSrJ3sVdKV'],
            shipping_address_collection: {
                allowed_countries: ['PL']
            }
        };

        if (req.body.coupons) {
            const activeCoupons = [];

            for (const couponObj of req.body.coupons) {
                const { amount_off } = await checkCoupon(couponObj.coupon);
                const formattedAmountOff = amount_off / 100;

                if (
                    formattedAmountOff > 0 &&
                    sumOfOrder(order) <= formattedAmountOff
                )
                    break;

                activeCoupons.push({
                    coupon: couponObj.coupon
                });
            }
            sessionData.discounts = activeCoupons;
        }

        // productsFromDB.forEach((product) => {
        //     const foundQuantity = req.body.order.find(
        //         (item) => item._id == product._id
        //     ).quantity;
        //     updateQuantityProduct(
        //         product,
        //         product.inStock - parseInt(foundQuantity)
        //     );
        // });

        const session = await stripe.checkout.sessions.create(sessionData);
        console.log(session);
        return res.status(200).json(session);
    } catch (err) {
        if (err.param === 'discounts[0][coupon]')
            return res.status(400).json({ err: "Can't find this coupon!" });
        console.log(`Error! ${err}`);
        return res.status(404).json(err);
    }
};

const getSession = async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(
            req.params.sessionId
        );

        return res.status(200).json(session);
    } catch (err) {
        console.log(err);
        return res.status(404).json({ error: true, found: false });
    }
};

const getSessionFromId = async (id) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(id);

        return session;
    } catch (err) {
        console.log(err);
        return { error: true, found: false };
    }
};

const getCoupon = async (req, res) => {
    try {
        const coupon = await stripe.coupons.retrieve(req.params.couponId);
        return res.status(200).json(coupon);
    } catch (err) {
        console.log(`getCoupon error! Error: ${err}`);
        return res.status(404).json(err);
    }
};

const receiveWebhook = async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];
        const event = await stripe.webhooks.constructEvent(
            req.rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        switch (event.type) {
            case 'checkout.session.completed':
                const checkoutCompleted = event.data.object;

                const order = await stripe.checkout.sessions.listLineItems(
                    checkoutCompleted.id
                );

                const itemsFromOrder = [];

                order.data.map((item) => {
                    const itemToAdd = {
                        name: item.description,
                        quantity: item.quantity
                    };
                    itemsFromOrder.push(itemToAdd);
                });

                removeProductQuantityByName(itemsFromOrder);

                //Server will remove item in database by their name so name must be unique

                console.log(order);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        console.log(event.type);

        // Return a response to acknowledge receipt of the event
        res.json({ received: true });
    } catch (err) {
        console.log(err);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
};

module.exports = {
    checkout,
    getSession,
    getCoupon,
    //createWebhook,
    receiveWebhook
};

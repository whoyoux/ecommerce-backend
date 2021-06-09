const stripe = require('stripe')(process.env.STRIPE_KEY);

const { getProductsById } = require('../controllers/products.controller.js');

const checkCoupon = async (couponId) => {
    try {
        return await stripe.coupons.retrieve(couponId);
    } catch (err) {
        return { err: true, errMessage: err };
    }
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

        productsFromDB.forEach((product) => {
            const foundQuantity = req.body.order.find(
                (item) => item._id == product._id
            ).quantity;

            order.push({
                name: product.name,
                amount: parseFloat(product.amount) * 100,
                quantity: foundQuantity,
                currency: 'PLN'
            });
        });

        let sessionData = {
            success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/payment/failed`,
            payment_method_types: ['card'],
            line_items: order,
            mode: 'payment',
            shipping_rates: ['shr_1IzJa1DmuEVpCSVSrJ3sVdKV'],
            shipping_address_collection: {
                allowed_countries: ['PL']
            }
        };

        if (req.body.coupons) {
            const activeCoupons = [];

            for (const couponObj of req.body.coupons) {
                const { amount_off } = await checkCoupon(couponObj.coupon);
                //console.log(amount_off);

                //TODO: Need to change! req.body.order is array!
                // if (amount_off > 0 && req.body.order.amount <= amount_off)
                //     break;

                activeCoupons.push({
                    coupon: couponObj.coupon
                });
            }

            sessionData.discounts = activeCoupons;
        }
        //console.log(sessionData);
        const session = await stripe.checkout.sessions.create(sessionData);
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

const getCoupon = async (req, res) => {
    try {
        const coupon = await stripe.coupons.retrieve(req.params.couponId);
        return res.status(200).json(coupon);
    } catch (err) {
        console.log(`getCoupon error! Error: ${err}`);
        return res.status(404).json(err);
    }
};

module.exports = {
    checkout,
    getSession,
    getCoupon
};

const express = require('express');
const router = express.Router();

const stripe = require('stripe')(process.env.STRIPE_KEY);

router.post('/checkout', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            success_url: `${process.env.PROD_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.PROD_URL}/payment/failed`,
            payment_method_types: ['card'],
            line_items: [req.body.order],
            mode: 'payment'
        });

        return res.status(200).json(session);
    } catch (err) {
        console.log(err);
        return res.status(404).json(err);
    }
});
router.post('/getSession', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(
            req.body.session_id
        );

        return res.status(200).json(session);
    } catch (err) {
        console.log(err);
        return res.status(404).json({ error: true, found: false });
    }
});

module.exports = router;

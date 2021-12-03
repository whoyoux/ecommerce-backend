const express = require('express');
const router = express.Router();

const {
    checkout,
    getSession,
    getCoupon,
    //createWebhook,
    receiveWebhook
} = require('../controllers/payment.controller');

//createWebhook();

router.post('/checkout', checkout);

router.get('/getSession/:sessionId', getSession);

router.get('/getCoupon/:couponId', getCoupon);

router.post('/webhook', receiveWebhook);

module.exports = router;

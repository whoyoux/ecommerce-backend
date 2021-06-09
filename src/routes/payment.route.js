const express = require('express');
const router = express.Router();

const {
    checkout,
    getSession,
    getCoupon
} = require('../controllers/payment.controller');

router.post('/checkout', checkout);

router.get('/getSession/:sessionId', getSession);

router.get('/getCoupon/:couponId', getCoupon);

module.exports = router;

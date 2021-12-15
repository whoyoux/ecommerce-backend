const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const adminAuth = require('../middlewares/adminAuth.middleware');

const {
    register,
    activateEmail,
    login,
    forgotPassword,
    resetPassword,
    getUserInfo,
    getAccessToken,
    logout
} = require('../controllers/user.controller');

// router.get('/', getProducts);
// router.delete('/:id', deleteProduct);

router.post('/register', register);
router.post('/activateEmail', activateEmail);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.post('/getAccessToken', getAccessToken);
router.put('/resetPassword', auth, resetPassword);
router.get('/getUserInfo', auth, adminAuth, getUserInfo);
router.get('/logout', logout);

module.exports = router;

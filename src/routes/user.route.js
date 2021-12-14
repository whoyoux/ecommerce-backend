const express = require('express');
const router = express.Router();

const {
    register,
    activateEmail,
    login,
    changePassword,
    logout
} = require('../controllers/user.controller');

// router.get('/', getProducts);
// router.delete('/:id', deleteProduct);

router.post('/register', register);
router.post('/activateEmail', activateEmail);
router.post('/login', login);
router.post('/changePassword', changePassword);
router.get('/logout', logout);

module.exports = router;

const express = require('express');
const router = express.Router();

const {
    register,
    login,
    changePassword
} = require('../controllers/user.controller');

// router.get('/', getProducts);
// router.delete('/:id', deleteProduct);

router.post('/register', register);
router.post('/login', login);
router.post('/changePassword', changePassword);

module.exports = router;

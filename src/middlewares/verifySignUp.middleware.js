const UserModel = require('../models/user.model.js');

const checkDuplicateEmail = async (req, res, next) => {
    try {
        UserModel.findOne({ email: req.body.email });
    } catch (err) {}
};

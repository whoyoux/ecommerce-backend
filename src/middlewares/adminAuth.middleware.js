const UserModel = require('../models/user.model');

const adminAuth = async (req, res, next) => {
    try {
        const user = await UserModel.findOne({ _id: req.user.id });

        if (user.role !== 'Admin')
            return res.status(401).json({
                status: 'error',
                message: 'Admin resources access denied.'
            });

        next();
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message });
    }
};

module.exports = adminAuth;

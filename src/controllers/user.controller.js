const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserModel = require('../models/user.model.js');

const JWT_SECRET = process.env.JWT_SECRET;

const register = async (req, res) => {
    const { firstName, lastName, email, password: plainPassword } = req.body;

    const schema = Joi.object({
        firstName: Joi.string().min(1).max(20).required(),
        lastName: Joi.string().min(1).max(30).required(),
        email: Joi.string().email().min(4).max(50).required(),
        password: Joi.string().min(6).max(35).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
        role: Joi.string().valid('Admin', 'User').required()
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
        res.status(404).send(
            `Validation error: ${error.details
                .map((x) => x.message)
                .join(', ')}`
        );
    } else {
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash(plainPassword, salt);
        try {
            const response = await UserModel.create({
                firstName,
                lastName,
                email,
                password
            });

            return res
                .status(200)
                .send('User created successfully: ' + response);
        } catch (err) {
            if (err.code === 11000) {
                // duplicate key
                return res.status(405).json({
                    status: 'error',
                    error: 'Username already in use'
                });
            }
        }
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    const schema = Joi.object({
        email: Joi.string().email().min(4).max(50).required(),
        password: Joi.string().min(6).max(35).required()
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
        res.status(404).send(
            `Validation error: ${error.details
                .map((x) => x.message)
                .join(', ')}`
        );
    } else {
        const user = await UserModel.findOne({ email }).lean();

        if (!user)
            return res
                .status(404)
                .json({ status: 'error', error: 'Invalid email/password' });

        if (await bcrypt.compare(password, user.password)) {
            // For now, everything is good.

            const token = jwt.sign(
                { id: user._id, email: user.email, role: user.role },
                JWT_SECRET
            );

            return res.json({ status: 'ok', data: token });
        } else {
            return res
                .status(400)
                .json({ status: 'error', error: 'Invalid email/password' });
        }
    }
};

const changePassword = async (req, res) => {
    const {
        token,
        email,
        oldPassword: plainOldPassword,
        newPassword: plainNewPassword
    } = req.body;

    const schema = Joi.object({
        email: Joi.string().email().min(4).max(50).required(),
        oldPassword: Joi.string().min(6).max(35).required(),
        newPassword: Joi.string().min(6).max(35).required(),
        token: Joi.string()
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
        res.status(404).send(
            `Validation error: ${error.details
                .map((x) => x.message)
                .join(', ')}`
        );
    } else {
        try {
            const user = jwt.verify(token, JWT_SECRET);

            const foundUser = await UserModel.findById(user.id).lean();

            //console.log(foundUser);
            //const hashedOldPassword = await bcrypt.hash(plainOldPassword, 10);
            const salt = await bcrypt.genSalt(10);
            const hashedNewPassword = await bcrypt.hash(plainNewPassword, salt);

            //console.log(hashedOldPassword);

            if (email !== user.email)
                return res.status(400).json({
                    status: 'error',
                    error: 'Email is not associated with this account or token is invalid!'
                });

            // if (hashedOldPassword !== foundUser.password)
            //     return res.status(400).json({
            //         status: 'error',
            //         error: 'Old password is incorrect!'
            //     });

            if (!(await bcrypt.compare(plainOldPassword, foundUser.password))) {
                return res.status(400).json({
                    status: 'error',
                    error: 'Old password is incorrect!'
                });
            }

            if (await bcrypt.compare(plainNewPassword, foundUser.password))
                return res.status(400).json({
                    status: 'error',
                    error: "Old password can't be equals to the new one!"
                });

            await UserModel.updateOne(
                { _id: user.id },
                { $set: { password: hashedNewPassword } }
            );
            return res
                .status(200)
                .json({ status: 'ok', data: 'Password changed successfully' });
        } catch (err) {
            console.log(err);
            return res.status(400).json({ status: 'error', error: err });
        }
    }
};

module.exports = {
    register,
    login,
    changePassword
};

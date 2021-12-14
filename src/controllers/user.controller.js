const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const sendMail = require('../utils/sendMail');

const UserModel = require('../models/user.model.js');

const createActivationToken = (payload) => {
    return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, {
        expiresIn: '10m'
    });
};

const createAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '15m'
    });
};

const createRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d'
    });
};

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
        //Check for users with this email
        const user = await UserModel.findOne({ email });
        if (user)
            return res
                .status(400)
                .json({ status: 'error', error: 'Email is already in use' });

        //Everything OK, go register
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash(plainPassword, salt);

        try {
            //! Instead of creating a new user, send mail with special token, after activation user will be created

            const activationToken = createActivationToken({
                firstName,
                lastName,
                email,
                password
            });

            const URL = `${process.env.CLIENT_URL}/user/activate/${activationToken}`;

            sendMail(email, 'Verify your account', URL);
            res.status(200).json({
                status: 'ok',
                message: 'Register success! Please activate your account.'
            });
        } catch (err) {
            return res.status(405).json({
                status: 'error',
                error: err
            });
        }
    }
};

const activateEmail = async (req, res) => {
    try {
        const { activationToken } = req.body;
        const user = await jwt.verify(
            activationToken,
            process.env.ACTIVATION_TOKEN_SECRET
        );

        const { firstName, lastName, email, password } = user;

        await UserModel.create({
            firstName,
            lastName,
            email,
            password
        });

        return res.status(200).send('User created successfully.');
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            error: err
        });
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

            const payload = {
                id: user._id,
                email: user.email,
                role: user.role
            };

            const token = await jwt.sign(
                payload,
                process.env.ACTIVATION_TOKEN_SECRET
            );

            res.cookie('refreshtoken', createRefreshToken(payload), {
                httpOnly: true,
                path: '/user/refresh_token',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            return res.json({ status: 'ok', data: 'Login success!' });
        } else {
            return res
                .status(400)
                .json({ status: 'error', error: 'Invalid email/password' });
        }
    }
};

const getAccessToken = async (req, res) => {
    try {
        refreshToken = req.cookie.refreshtoken;
        if (!refreshToken)
            return res
                .status(400)
                .json({ status: 'error', message: 'Please log in!' });

        const user = await jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        const accessToken = createAccessToken(user);
        res.status(200).json({ status: 'ok', data: accessToken });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err });
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
            const user = jwt.verify(token, ACTIVATION_TOKEN_SECRET);

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

const logout = async (req, res) => {
    try {
        res.clearCookie('refreshtoken', { path: '/user/refresh_token' });
        return res.json({ status: 'ok', data: 'Logged out.' });
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message });
    }
};

module.exports = {
    register,
    activateEmail,
    login,
    changePassword,
    logout
};

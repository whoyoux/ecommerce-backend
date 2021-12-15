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
        const user = jwt.verify(
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
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            };

            res.cookie('refreshtoken', createRefreshToken(payload), {
                httpOnly: true,
                path: '/user/refresh_token',
                sameSite: 'None',
                secure: true,
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
        refreshToken = req.cookies.refreshtoken;

        console.log(req.cookies);

        if (!refreshToken)
            return res
                .status(401)
                .json({ status: 'error', message: 'Please log in!' });

        const user = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        const payload = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
        };

        const accessToken = createAccessToken(payload);
        res.status(200).json({ status: 'ok', data: accessToken });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await UserModel.findOne({ email: email });
        if (!user)
            return res.status(404).json({
                status: 'error',
                message: 'This email does not exist!'
            });

        const payload = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
        };

        const accessToken = createAccessToken(payload);
        const url = `${process.env.CLIENT_URL}/user/resetPassword/${accessToken}`;

        sendMail(email, 'Reset your password', url);
        res.status(200).json({ status: 'ok' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err });
    }
};

const resetPassword = async (req, res) => {
    try {
        //TODO: User can only use 1 time same forgot password link per password change
        const { password } = req.body;

        const salt = await bcrypt.genSalt(10);
        const passwordHashed = await bcrypt.hash(password, salt);

        await UserModel.findOneAndUpdate(
            { _id: req.user.id },
            { password: passwordHashed }
        );
        res.status(200).json({ status: 'ok' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err });
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

const getUserInfo = async (req, res) => {
    try {
        console.log(req.user);
        const user = await UserModel.findById(req.user.id).select('-password');
        return res.status(200).json({ status: 'ok', data: user });
    } catch (err) {
        return res.status(401).json({ status: 'error', message: err });
    }
};

module.exports = {
    register,
    activateEmail,
    login,
    getAccessToken,
    forgotPassword,
    resetPassword,
    logout,
    getUserInfo
};

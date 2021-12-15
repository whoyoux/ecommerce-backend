const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization');
        if (!token)
            return res
                .status(401)
                .json({ status: 'error', message: 'Invalid Authentication.' });

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err)
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid Authentication.'
                });

            req.user = user;
            next();
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err });
    }
};

module.exports = auth;

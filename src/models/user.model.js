const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    address_line1: {
        type: String
    },
    address_line2: {
        type: String
    },
    postal_code: {
        type: String
    },
    city: {
        type: String
    },
    country: {
        type: String
    },
    telephone: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    role: {
        type: String,
        default: 'User'
    }
});

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;

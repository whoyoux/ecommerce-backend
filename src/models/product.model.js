const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ProductSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    amount: {
        type: mongoose.Decimal128,
        required: true
    },
    images: [
        {
            url: {
                type: String,
                required: true
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    inStock: {
        type: Number,
        required: true
    },
    author: {
        type: String,
        default: 'SERVER'
    }
});

const ProductModel = mongoose.model('Product', ProductSchema);

module.exports = ProductModel;

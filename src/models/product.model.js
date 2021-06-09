const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  name: {
      type: String,
      required: true
  },
  description: {
      type: String,
      required: true
  },
  price: {
      type: Number,
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
  author: {
      type: String,
      default: "SERVER"
  }
});

const ProductModel = mongoose.model('Product', ProductSchema);

module.exports = ProductModel;
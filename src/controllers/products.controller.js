const ProductModel = require('../models/product.model.js');
const mongoose = require('mongoose');

const getProducts = async (req, res) => {
    try {
        const products = await ProductModel.find({});
        res.status(200).send(products);
    } catch (err) {
        console.log(`getProducts error! Error: ${err}`);
        res.status(500).send({ error: true, errorMessage: err });
    }
};

const getProductsById = async (productIds) => {
    try {
        const prepareArray = [];

        productIds.forEach((productId) => {
            prepareArray.push(mongoose.Types.ObjectId(productId._id));
        });

        const response = await ProductModel.find({
            _id: {
                $in: prepareArray
            }
        });
        return response;
    } catch (err) {
        console.log(`getProductsById ${err}`);
        return { error: true, errorMessage: "Can't find products in DB!" };
    }
};

const updateQuantityProduct = async (productId, newQuantity) => {
    try {
        const response = await ProductModel.findByIdAndUpdate(
            productId,
            {
                $set: { inStock: parseInt(newQuantity) }
            },
            { new: true }
        );
        return response;
    } catch (err) {
        console.log(`updateQuantityProduct ${err}`);
        return { error: true, errorMessage: "Can't update product in DB!" };
    }
};

const deleteProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const response = await ProductModel.findByIdAndDelete(id);

        if (response === null) {
            return res.status(404).send({
                error: true,
                errorMessage: "Can't find product with this id!"
            });
        }

        res.status(200).send({
            error: false,
            errorMessage: 'Product deleted!'
        });
    } catch (err) {
        res.status(500).send({ error: true, errorMessage: err });
    }
};

const getProduct = async (productId) => {
    try {
        const found = await ProductModel.findById(productId);
        if (found === null)
            return { error: true, errorMessage: `Can't find the product!` };
        return found;
    } catch (err) {
        console.log(`getProduct error! Error: ${err}`);
        return { error: true, errorMessage: err };
    }
};

const getProductByName = async (productName) => {
    try {
        const found = await ProductModel.find({ name: productName }).lean();
        if (found === null)
            return { error: true, errorMessage: `Can't find the product!` };
        return found[0];
    } catch (err) {
        console.log(`getProduct error! Error: ${err}`);
        return { error: true, errorMessage: err };
    }
};

const removeProductQuantityByName = async (products) => {
    //Need to use for
    try {
        for (const product of products) {
            const item = await getProductByName(product.name);
            await updateQuantityProduct(
                item._id,
                parseInt(item.inStock) - parseInt(product.quantity)
            );
        }
    } catch (err) {
        console.log(`Error with removeProductQuantityByName ! ${err}`);
    }
};

module.exports = {
    getProducts,
    getProduct,
    getProductsById,
    deleteProduct,
    updateQuantityProduct,
    removeProductQuantityByName
};

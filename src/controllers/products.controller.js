const data = require('../db/db.json');
const ProductModel = require('../models/product.model.js');

const getProducts = async (req, res) => {
    try {
        const products = await ProductModel.find({});
        res.status(200).send(products);
    } catch (err) {
        console.log(`getProducts error! Error: ${err}`);
        res.status(500).send({ error: true, errorMessage: err });
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

module.exports = {
    getProducts,
    getProduct,
    deleteProduct
};

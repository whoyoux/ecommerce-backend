const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');

require('dotenv').config();
const PORT = process.env.PORT || 5000;

const ProductModel = require('./models/product.model.js');

const paymentRoutes = require('./routes/payment.route.js');
const productsRoutes = require('./routes/products.route.js');

const { getProduct } = require('./controllers/products.controller.js');

const connectToDatabase = async () => {
    try {
        const db = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        });
        console.log(`App connected to database!`);

        // const product1 = new ProductModel({
        //     name: 'Test1',
        //     description: 'test desc',
        //     amount: 150,
        //     images: [
        //         {
        //             url: 'https://rdironworks.com/wp-content/uploads/2017/12/dummy-200x200.png'
        //         }
        //     ],
        //     inStock: 2
        // });
        // await product1.save();

        // console.log(await getProduct(savedProduct._id));
    } catch (err) {
        console.log(`Can't connect to database! Abort program!`);
        console.error(err);
        return;
    }
};

connectToDatabase();

app.get('/', (req, res) => res.send('Working 🚀 !!!'));

//Need raw body for verify signature in webhook
var rawBodySaver = function (req, res, buf, encoding) {
    if (buf && buf.length) {
        req.rawBody = buf.toString(encoding || 'utf8');
    }
};
app.use(express.json({ verify: rawBodySaver }));
app.use(express.urlencoded({ verify: rawBodySaver, extended: true }));
app.use(express.raw({ verify: rawBodySaver, type: '*/*' }));
app.use(cors());

app.use('/payment', paymentRoutes);
app.use('/products', productsRoutes);

app.listen(PORT, console.log(`App is listening on: ${PORT}`));

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

        // const product = new ProductModel({
        //     name: "test",
        //     description: "test desc",
        //     amount: 11,
        //     images: [
        //         {url: "http://google.com"}
        //     ]
        // })
        // await product.save()

        // console.log(await getProduct('60bfac7e6e73f3287881141d'))
    } catch (err) {
        console.error(`Can't connect to database! Abort program!`);
        return;
    }
};

connectToDatabase();

app.get('/', (req, res) => res.send('Working 🚀 !!!'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use('/payment', paymentRoutes);
app.use('/products', productsRoutes);

app.listen(PORT, console.log(`App is listening on: ${PORT}`));

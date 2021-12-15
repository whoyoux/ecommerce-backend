const express = require('express');
const app = express();
const mongoose = require('mongoose');

// Middlewares
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

require('dotenv').config();
const PORT = process.env.PORT || 5000;

// Models
const ProductModel = require('./models/product.model.js');
const UserModel = require('./models/user.model.js');

// Routes
const paymentRoutes = require('./routes/payment.route.js');
const productsRoutes = require('./routes/products.route.js');
const userRoutes = require('./routes/user.route.js');

// Others
const { getProduct } = require('./controllers/products.controller.js');

const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        });
        console.log(`App connected to database!`);
    } catch (err) {
        console.log(`Can't connect to database! Abort program!`);
        console.error(err);
        return;
    }
};

connectToDatabase();

// EXPRESS RATE LIMIT
app.set('trust proxy', 1);
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.get('/', (req, res) => res.send('Working 🚀 !!!'));

//Need raw body for verify signature in webhook
var rawBodySaver = function (req, res, buf, encoding) {
    if (buf && buf.length) {
        req.rawBody = buf.toString(encoding || 'utf8');
    }
};

//SOME STUFF
app.use(
    cors({
        origin: [
            'http://localhost:3000',
            'https://localhost:3000',
            'https://ecommerce-beta-three.vercel.app'
        ],
        allowedHeaders: ['Content-Type'],
        credentials: true,
        preflightContinue: true
    })
);

app.use(express.json({ verify: rawBodySaver }));
app.use(express.urlencoded({ verify: rawBodySaver, extended: true }));
app.use(express.raw({ verify: rawBodySaver, type: '*/*' }));

app.use(cookieParser());

// ROUTES
app.use('/payment', paymentRoutes);
app.use('/products', productsRoutes);
app.use('/user', userRoutes);

app.listen(PORT, console.log(`App is listening on: ${PORT}`));

const createNewProduct = async () => {
    const product1 = new ProductModel({
        name: 'Test1',
        description: 'test desc',
        amount: 150,
        images: [
            {
                url: 'https://rdironworks.com/wp-content/uploads/2017/12/dummy-200x200.png'
            }
        ],
        inStock: 2
    });
    await product1.save();
    console.log(await getProduct(savedProduct._id));
};

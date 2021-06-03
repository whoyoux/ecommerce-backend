const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const PORT = process.env.PORT || 5000;

const paymentRoutes = require('./routes/payment.route.js');

app.get('/', (req, res) => res.send('Working 🚀 !!!'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use('/payment', paymentRoutes);

app.listen(PORT, console.log(`App is listening on: ${PORT}`));

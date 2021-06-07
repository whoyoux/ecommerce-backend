const data = require('../db/db.json');

const getProducts = async (req, res) => {
    res.json(data);
};

module.exports = {
    getProducts
};

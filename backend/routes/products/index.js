const express = require('express');
const router = express.Router();

// Import individual operation files
const getProducts = require('./getProducts');
const getProductById = require('./getProductById');
const createProduct = require('./createProduct');
const updateProduct = require('./updateProduct');
const deleteProduct = require('./deleteProduct');

// Mount routes
router.use('/', getProducts);       // GET /api/products
router.use('/', getProductById);    // GET /api/products/:id
router.use('/', createProduct);     // POST /api/products
router.use('/', updateProduct);     // PUT /api/products/:id
router.use('/', deleteProduct);     // DELETE /api/products/:id

module.exports = router; 
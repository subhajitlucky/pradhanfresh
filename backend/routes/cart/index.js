const express = require('express');
const router = express.Router();

// Import cart route handlers
const addToCartRoute = require('./addToCart');
const getCartRoute = require('./getCart');
const updateCartItemRoute = require('./updateCartItem');
const removeCartItemRoute = require('./removeCartItem');
const clearCartRoute = require('./clearCart');

// Mount cart routes (order matters! Specific routes before parameterized ones)
router.use('/add', addToCartRoute);        // POST /api/cart/add
router.use('/clear', clearCartRoute);      // DELETE /api/cart/clear (must come before /:itemId)
router.use('/', getCartRoute);             // GET /api/cart
router.use('/', updateCartItemRoute);      // PUT /api/cart/:itemId
router.use('/', removeCartItemRoute);      // DELETE /api/cart/:itemId

module.exports = router; 
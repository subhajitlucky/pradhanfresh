const express = require('express');
const router = express.Router();

// Import order route handlers
const createOrderRoute = require('./createOrder');
const getOrdersRoute = require('./getOrders');
const getOrderDetailsRoute = require('./getOrderDetails');
const updateOrderStatusRoute = require('./updateOrderStatus');
const cancelOrderRoute = require('./cancelOrder');

// Mount order routes (order matters! Specific routes before parameterized ones)
router.use('/create', createOrderRoute);                    // POST /api/orders/create
router.use('/', getOrdersRoute);                           // GET /api/orders
router.use('/', getOrderDetailsRoute);                     // GET /api/orders/:orderNumber
router.use('/', updateOrderStatusRoute);                   // PUT /api/orders/:orderNumber/status
router.use('/', cancelOrderRoute);                         // PUT /api/orders/:orderNumber/cancel

module.exports = router; 
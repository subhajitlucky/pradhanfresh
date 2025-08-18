// Re-export all order operations from focused modules
const { createOrderFromCart } = require('./create');
const { updateOrderStatus } = require('./update');
const { cancelOrder } = require('./cancel');
const { getCompleteOrder } = require('./retrieve');

module.exports = {
  createOrderFromCart,
  updateOrderStatus,
  cancelOrder,
  getCompleteOrder
};
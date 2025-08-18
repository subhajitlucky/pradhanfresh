const prisma = require('../prisma/client');

/**
 * Calculate cart total amount
 * @param {Array} cartItems - Array of cart items
 * @returns {Number} Total amount
 */
const calculateCartTotal = (cartItems) => {
  return cartItems.reduce((total, item) => total + item.subtotal, 0);
};

/**
 * Calculate subtotal for a cart item
 * @param {Number} quantity - Quantity of the item
 * @param {Number} price - Price per unit
 * @returns {Number} Subtotal
 */
const calculateSubtotal = (quantity, price) => {
  return quantity * price;
};

/**
 * Validate if product has enough stock
 * @param {Number} productId - Product ID
 * @param {Number} requestedQuantity - Requested quantity
 * @returns {Object} Validation result
 */
const validateStock = async (productId, requestedQuantity) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, isAvailable: true, name: true }
    });

    if (!product) {
      return {
        valid: false,
        message: 'Product not found'
      };
    }

    if (!product.isAvailable) {
      return {
        valid: false,
        message: `${product.name} is currently unavailable`
      };
    }

    if (product.stock < requestedQuantity) {
      return {
        valid: false,
        message: `Only ${product.stock} units of ${product.name} available`
      };
    }

    return {
      valid: true,
      availableStock: product.stock
    };
  } catch (error) {
    return {
      valid: false,
      message: 'Error validating stock'
    };
  }
};

/**
 * Set cart expiry time (24 hours from now)
 * @returns {Date} Expiry date
 */
const getCartExpiryTime = () => {
  const expiryTime = new Date();
  expiryTime.setHours(expiryTime.getHours() + 24);
  return expiryTime;
};

/**
 * Clean expired carts
 * @returns {Number} Number of deleted carts
 */
const cleanExpiredCarts = async () => {
  try {
    const result = await prisma.cart.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    return result.count;
  } catch (error) {
    console.error('Error cleaning expired carts:', error);
    return 0;
  }
};

module.exports = {
  calculateCartTotal,
  calculateSubtotal,
  validateStock,
  getCartExpiryTime,
  cleanExpiredCarts
}; 
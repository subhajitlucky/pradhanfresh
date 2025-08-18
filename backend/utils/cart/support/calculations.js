const prisma = require('../../prisma/client');
const { calculateCartTotal, getCartExpiryTime } = require('../cartUtils');

/**
 * Recalculate and update cart total
 * @param {Number} cartId - Cart ID
 * @returns {Promise<Object>} Updated cart with items
 */
const updateCartTotal = async (cartId) => {
  const updatedCart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              thumbnail: true,
              stock: true,
              isAvailable: true,
              unit: true
            }
          }
        }
      }
    }
  });

  const newTotalAmount = calculateCartTotal(updatedCart.items);

  await prisma.cart.update({
    where: { id: cartId },
    data: {
      totalAmount: newTotalAmount,
      updatedAt: new Date(),
      expiresAt: getCartExpiryTime() // Extend expiry time
    }
  });

  return updatedCart;
};

/**
 * Get final cart data for response
 * @param {Number} cartId - Cart ID
 * @returns {Promise<Object>} Complete cart data
 */
const getFinalCartData = async (cartId) => {
  return await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              thumbnail: true,
              stock: true,
              isAvailable: true,
              unit: true
            }
          }
        }
      }
    }
  });
};

module.exports = {
  updateCartTotal,
  getFinalCartData
};

/*
=== CART CALCULATIONS MODULE ===

This module handles cart total calculations and data retrieval.

KEY FUNCTIONALITY:
- Recalculates cart totals after item changes
- Updates cart timestamps and extends expiry time
- Provides formatted cart data for API responses
- Maintains cart state consistency

BUSINESS LOGIC:
- Recalculates total from all cart items
- Extends cart expiry on every activity
- Updates cart modification timestamp
- Includes complete product information for responses

USAGE:
```javascript
const { updateCartTotal, getFinalCartData } = require('./calculations');

// Update cart totals after item changes
await updateCartTotal(cartId);

// Get complete cart data for API response
const cartData = await getFinalCartData(cartId);
```

PERFORMANCE:
- Single queries for cart with items and products
- Selective field querying for product data
- Efficient updates vs. full replacements
- Optimized for API response formatting
*/

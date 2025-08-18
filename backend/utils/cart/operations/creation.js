const prisma = require('../../prisma/client');
const { getCartExpiryTime } = require('../cartUtils');

/**
 * Get or create cart for a user
 * @param {Number} userId - User ID
 * @returns {Promise<Object>} Cart object with items
 */
const getOrCreateCart = async (userId) => {
  let cart = await prisma.cart.findUnique({
    where: { userId: userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              thumbnail: true,
              stock: true,
              isAvailable: true
            }
          }
        }
      }
    }
  });

  if (!cart) {
    // Create new cart for user
    cart = await prisma.cart.create({
      data: {
        userId: userId,
        totalAmount: 0,
        expiresAt: getCartExpiryTime()
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                thumbnail: true,
                stock: true,
                isAvailable: true
              }
            }
          }
        }
      }
    });
  }

  return cart;
};

module.exports = {
  getOrCreateCart
};

/*
=== CART CREATION MODULE ===

This module handles cart creation and retrieval operations.

KEY FUNCTIONALITY:
- Finds existing cart for user or creates new one
- Includes all cart items and product details in queries
- Sets appropriate expiry time for new carts
- Uses optimized queries with selective field inclusion

USAGE:
```javascript
const { getOrCreateCart } = require('./creation');
const cart = await getOrCreateCart(userId);
```

BUSINESS LOGIC:
- One cart per user at any time
- New carts get default expiry time
- Includes complete product information for immediate use
- Handles both existing and new user scenarios
*/

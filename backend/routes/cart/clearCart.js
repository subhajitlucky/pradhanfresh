const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');

// DELETE /api/cart/clear - Clear all items from cart
router.delete('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // === FIND USER'S CART ===
    const cart = await prisma.cart.findUnique({
      where: { userId: userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: 'Cart is already empty',
        data: {
          itemsCount: 0,
          totalAmount: 0,
          isEmpty: true
        }
      });
    }

    if (cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Cart is already empty',
        data: {
          itemsCount: 0,
          totalAmount: 0,
          isEmpty: true
        }
      });
    }

    // === STORE CLEARED ITEMS INFO ===
    const clearedItemsCount = cart.items.length;
    const clearedItems = cart.items.map(item => ({
      id: item.id,
      productName: item.product.name,
      quantity: item.quantity,
      subtotal: item.subtotal
    }));

    // === DELETE ALL CART ITEMS ===
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    // === UPDATE CART TOTAL ===
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        totalAmount: 0,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Cleared cart for user ${userId}: ${clearedItemsCount} items removed`);

    res.status(200).json({
      success: true,
      message: `Cart cleared successfully. ${clearedItemsCount} item${clearedItemsCount !== 1 ? 's' : ''} removed.`,
      data: {
        cart: {
          id: cart.id,
          userId: cart.userId,
          items: [],
          totalAmount: 0,
          itemsCount: 0,
          createdAt: cart.createdAt,
          updatedAt: new Date(),
          expiresAt: cart.expiresAt
        },
        itemsCount: 0,
        totalAmount: 0,
        isEmpty: true,
        clearedItems: clearedItems,
        clearedItemsCount: clearedItemsCount
      }
    });

  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 
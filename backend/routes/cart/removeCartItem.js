const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');
const { calculateCartTotal } = require('../../utils/cart/cartUtils');

// DELETE /api/cart/:itemId - Remove item from cart
router.delete('/:itemId', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.userId;

    // === INPUT VALIDATION ===
    const parsedItemId = parseInt(itemId);

    if (isNaN(parsedItemId) || parsedItemId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart item ID',
        error: 'Validation Error'
      });
    }

    // === FIND CART ITEM ===
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: parsedItemId },
      include: {
        cart: {
          select: {
            id: true,
            userId: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            thumbnail: true
          }
        }
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found',
        error: 'Not Found'
      });
    }

    // === VERIFY OWNERSHIP ===
    if (cartItem.cart.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: This cart item does not belong to you',
        error: 'Forbidden'
      });
    }

    // === DELETE CART ITEM ===
    await prisma.cartItem.delete({
      where: { id: parsedItemId }
    });

    console.log(`✅ Removed cart item: ${cartItem.product.name}`);

    // === RECALCULATE CART TOTAL ===
    const cart = await prisma.cart.findUnique({
      where: { id: cartItem.cart.id },
      include: {
        items: true
      }
    });

    const newTotalAmount = calculateCartTotal(cart.items);

    await prisma.cart.update({
      where: { id: cartItem.cart.id },
      data: {
        totalAmount: newTotalAmount,
        updatedAt: new Date()
      }
    });

    // === GET UPDATED CART ===
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cartItem.cart.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                thumbnail: true,
                stock: true,
                isAvailable: true,
                unit: true,
                price: true,
                salePrice: true
              }
            }
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: `${cartItem.product.name} removed from cart successfully`,
      data: {
        removedItem: {
          id: cartItem.id,
          productId: cartItem.product.id,
          productName: cartItem.product.name
        },
        cart: updatedCart,
        itemsCount: updatedCart.items.length,
        totalAmount: updatedCart.totalAmount,
        isEmpty: updatedCart.items.length === 0
      }
    });

  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove cart item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 
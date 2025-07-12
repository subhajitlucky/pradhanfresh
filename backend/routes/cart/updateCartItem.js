const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');
const { validateStock, calculateSubtotal, calculateCartTotal, getCartExpiryTime } = require('../../utils/cartUtils');

// PUT /api/cart/:itemId - Update cart item quantity
router.put('/:itemId', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.userId;

    // === INPUT VALIDATION ===
    const parsedItemId = parseInt(itemId);
    const parsedQuantity = parseInt(quantity);

    if (isNaN(parsedItemId) || parsedItemId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart item ID',
        error: 'Validation Error'
      });
    }

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number',
        error: 'Validation Error'
      });
    }

    if (parsedQuantity > 99) {
      return res.status(400).json({
        success: false,
        message: 'Maximum quantity per item is 99',
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
            price: true,
            salePrice: true,
            stock: true,
            isAvailable: true,
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

    // === STOCK VALIDATION ===
    const stockValidation = await validateStock(cartItem.productId, parsedQuantity);
    if (!stockValidation.valid) {
      return res.status(400).json({
        success: false,
        message: stockValidation.message,
        error: 'Stock Error'
      });
    }

    // === UPDATE CART ITEM ===
    const currentPrice = cartItem.product.salePrice || cartItem.product.price;
    const newSubtotal = calculateSubtotal(parsedQuantity, currentPrice);

    const updatedCartItem = await prisma.cartItem.update({
      where: { id: parsedItemId },
      data: {
        quantity: parsedQuantity,
        price: currentPrice, // Update price in case it changed
        subtotal: newSubtotal,
        updatedAt: new Date()
      },
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
    });

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
        updatedAt: new Date(),
        expiresAt: getCartExpiryTime() // Extend expiry time
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

    console.log(`✅ Updated cart item: ${cartItem.product.name} (${parsedQuantity} units)`);

    res.status(200).json({
      success: true,
      message: `Cart item updated successfully`,
      data: {
        updatedItem: updatedCartItem,
        cart: updatedCart,
        itemsCount: updatedCart.items.length,
        totalAmount: updatedCart.totalAmount
      }
    });

  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 
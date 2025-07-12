const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');
const { calculateCartTotal } = require('../../utils/cartUtils');

// GET /api/cart - Get user's cart
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // === GET USER'S CART ===
    const cart = await prisma.cart.findUnique({
      where: { userId: userId },
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
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: 'Cart is empty',
        data: {
          cart: null,
          itemsCount: 0,
          totalAmount: 0,
          isEmpty: true
        }
      });
    }

    // === VALIDATE CART ITEMS AGAINST CURRENT STOCK ===
    const validatedItems = [];
    let hasStockIssues = false;
    const stockIssues = [];

    for (const item of cart.items) {
      const product = item.product;
      
      // Check if product is still available
      if (!product.isAvailable) {
        hasStockIssues = true;
        stockIssues.push({
          productId: product.id,
          productName: product.name,
          issue: 'Product is no longer available'
        });
        continue;
      }

      // Check if requested quantity is still available
      if (product.stock < item.quantity) {
        hasStockIssues = true;
        stockIssues.push({
          productId: product.id,
          productName: product.name,
          issue: `Only ${product.stock} units available (you have ${item.quantity} in cart)`
        });
        
        // Add item with available stock information
        validatedItems.push({
          ...item,
          stockAvailable: product.stock,
          hasStockIssue: true
        });
      } else {
        // Item is valid
        validatedItems.push({
          ...item,
          stockAvailable: product.stock,
          hasStockIssue: false
        });
      }
    }

    // === RECALCULATE TOTAL (in case prices changed) ===
    let recalculatedTotal = 0;
    let needsRecalculation = false;

    for (const item of validatedItems) {
      const currentPrice = item.product.salePrice || item.product.price;
      const expectedSubtotal = item.quantity * currentPrice;
      
      if (Math.abs(item.subtotal - expectedSubtotal) > 0.01) {
        needsRecalculation = true;
      }
      
      recalculatedTotal += expectedSubtotal;
    }

    // === UPDATE CART TOTAL IF NEEDED ===
    if (needsRecalculation && Math.abs(cart.totalAmount - recalculatedTotal) > 0.01) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          totalAmount: recalculatedTotal,
          updatedAt: new Date()
        }
      });
    }

    // === PREPARE RESPONSE ===
    const response = {
      success: true,
      message: hasStockIssues ? 'Cart retrieved with stock issues' : 'Cart retrieved successfully',
      data: {
        cart: {
          id: cart.id,
          userId: cart.userId,
          items: validatedItems,
          totalAmount: needsRecalculation ? recalculatedTotal : cart.totalAmount,
          itemsCount: validatedItems.length,
          createdAt: cart.createdAt,
          updatedAt: cart.updatedAt,
          expiresAt: cart.expiresAt
        },
        itemsCount: validatedItems.length,
        totalAmount: needsRecalculation ? recalculatedTotal : cart.totalAmount,
        isEmpty: validatedItems.length === 0,
        hasStockIssues: hasStockIssues,
        stockIssues: hasStockIssues ? stockIssues : []
      }
    };

    if (hasStockIssues) {
      response.warnings = stockIssues;
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Error retrieving cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 
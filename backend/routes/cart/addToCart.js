const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');
const { validateStock, calculateSubtotal, calculateCartTotal, getCartExpiryTime } = require('../../utils/cartUtils');

// POST /api/cart/add - Add item to cart
router.post('/', requireAuth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.userId;

    // === INPUT VALIDATION ===
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
        error: 'Validation Error'
      });
    }

    const parsedProductId = parseInt(productId);
    const parsedQuantity = parseInt(quantity);

    if (isNaN(parsedProductId) || parsedProductId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
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

    // === GET PRODUCT DETAILS ===
    const product = await prisma.product.findUnique({
      where: { id: parsedProductId },
      select: {
        id: true,
        name: true,
        price: true,
        salePrice: true,
        stock: true,
        isAvailable: true,
        thumbnail: true
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'Not Found'
      });
    }

    // === STOCK VALIDATION ===
    const stockValidation = await validateStock(parsedProductId, parsedQuantity);
    if (!stockValidation.valid) {
      return res.status(400).json({
        success: false,
        message: stockValidation.message,
        error: 'Stock Error'
      });
    }

    // === GET OR CREATE CART ===
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

    // === CHECK IF PRODUCT ALREADY IN CART ===
    const existingCartItem = cart.items.find(item => item.productId === parsedProductId);
    const currentPrice = product.salePrice || product.price;

    if (existingCartItem) {
      // Update existing item quantity
      const newQuantity = existingCartItem.quantity + parsedQuantity;
      
      // Validate total quantity against stock
      const totalStockValidation = await validateStock(parsedProductId, newQuantity);
      if (!totalStockValidation.valid) {
        return res.status(400).json({
          success: false,
          message: totalStockValidation.message,
          error: 'Stock Error'
        });
      }

      const newSubtotal = calculateSubtotal(newQuantity, currentPrice);

      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: newQuantity,
          price: currentPrice, // Update price in case it changed
          subtotal: newSubtotal,
          updatedAt: new Date()
        }
      });

      console.log(`✅ Updated cart item: ${product.name} (${newQuantity} units)`);
    } else {
      // Add new item to cart
      const subtotal = calculateSubtotal(parsedQuantity, currentPrice);

      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: parsedProductId,
          quantity: parsedQuantity,
          price: currentPrice,
          subtotal: subtotal
        }
      });

      console.log(`✅ Added new item to cart: ${product.name} (${parsedQuantity} units)`);
    }

    // === RECALCULATE CART TOTAL ===
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
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
      where: { id: cart.id },
      data: {
        totalAmount: newTotalAmount,
        updatedAt: new Date(),
        expiresAt: getCartExpiryTime() // Extend expiry time
      }
    });

    // === RETURN RESPONSE ===
    const finalCart = await prisma.cart.findUnique({
      where: { id: cart.id },
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

    res.status(200).json({
      success: true,
      message: `${product.name} added to cart successfully`,
      data: {
        cart: finalCart,
        itemsCount: finalCart.items.length,
        totalAmount: finalCart.totalAmount
      }
    });

  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 
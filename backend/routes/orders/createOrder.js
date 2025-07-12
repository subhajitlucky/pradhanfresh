const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');
const { 
  generateOrderNumber, 
  calculateOrderTotals, 
  calculateItemSubtotal,
  validateCartForOrder,
  updateProductStock,
  validateDeliveryAddress,
  calculateDeliveryFee
} = require('../../utils/orderUtils');

// POST /api/orders/create - Create order from cart
router.post('/', requireAuth, async (req, res) => {
  try {
    const { 
      deliveryAddress, 
      deliveryDate, 
      deliverySlot, 
      paymentMethod = 'COD',
      orderNotes,
      discount = 0 
    } = req.body;
    const userId = req.user.userId;

    // === INPUT VALIDATION ===
    if (!deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required',
        error: 'Validation Error'
      });
    }

    // Validate delivery address
    const addressValidation = validateDeliveryAddress(deliveryAddress);
    if (!addressValidation.valid) {
      return res.status(400).json({
        success: false,
        message: addressValidation.message,
        error: 'Validation Error'
      });
    }

    // Validate payment method
    const validPaymentMethods = ['COD', 'ONLINE', 'WALLET'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method',
        error: 'Validation Error'
      });
    }

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
                price: true,
                salePrice: true,
                stock: true,
                isAvailable: true,
                sku: true,
                unit: true,
                thumbnail: true
              }
            }
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
        error: 'Validation Error'
      });
    }

    // === VALIDATE CART FOR ORDER ===
    const cartValidation = await validateCartForOrder(cart);
    if (!cartValidation.valid) {
      return res.status(400).json({
        success: false,
        message: cartValidation.message,
        error: 'Stock Error',
        details: cartValidation.errors
      });
    }

    // === PREPARE ORDER ITEMS ===
    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = cartItem.product;
      const currentPrice = product.salePrice || product.price;
      const itemSubtotal = calculateItemSubtotal(cartItem.quantity, currentPrice);
      
      orderItems.push({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: cartItem.quantity,
        price: currentPrice,
        subtotal: itemSubtotal,
        unit: product.unit,
        thumbnail: product.thumbnail
      });

      subtotal += itemSubtotal;
    }

    // === CALCULATE TOTALS ===
    const deliveryFee = calculateDeliveryFee(deliveryAddress.pincode, subtotal);
    const tax = 0; // Can be configured based on business requirements
    
    const totals = calculateOrderTotals(orderItems, {
      deliveryFee,
      tax,
      discount: parseFloat(discount) || 0
    });

    // === GENERATE ORDER NUMBER ===
    const orderNumber = await generateOrderNumber();

    // === CREATE ORDER IN DATABASE TRANSACTION ===
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: 'PENDING',
          subtotal: totals.subtotal,
          deliveryFee: totals.deliveryFee,
          tax: totals.tax,
          discount: totals.discount,
          totalAmount: totals.totalAmount,
          deliveryAddress,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          deliverySlot,
          paymentMethod,
          paymentStatus: 'PENDING',
          orderNotes
        }
      });

      // Create order items
      const orderItemsData = orderItems.map(item => ({
        orderId: newOrder.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        unit: item.unit,
        thumbnail: item.thumbnail
      }));

      await tx.orderItem.createMany({
        data: orderItemsData
      });

      // Update product stock
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      // Clear user's cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      await tx.cart.update({
        where: { id: cart.id },
        data: {
          totalAmount: 0,
          updatedAt: new Date()
        }
      });

      return newOrder;
    });

    // === GET COMPLETE ORDER DATA ===
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                thumbnail: true,
                unit: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`✅ Order created successfully: ${orderNumber} for user ${userId}`);
    console.log(`   Items: ${completeOrder.items.length}, Total: ₹${completeOrder.totalAmount}`);

    res.status(201).json({
      success: true,
      message: `Order ${orderNumber} created successfully`,
      data: {
        order: completeOrder,
        orderNumber: orderNumber,
        totalAmount: completeOrder.totalAmount,
        itemsCount: completeOrder.items.length,
        estimatedDelivery: deliveryDate || 'To be confirmed',
        paymentMethod: completeOrder.paymentMethod
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 
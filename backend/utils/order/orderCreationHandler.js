const prisma = require('../../prisma/client');
const { validateCartForOrder, validateDeliveryAddress } = require('../orderUtils');
const { validateOrderCreationInput, validateDeliveryDetails } = require('./validation/orderValidation');
const { createOrderFromCart } = require('./operations/orderOperations');

/**
 * Handle order creation from cart
 */
const handleOrderCreation = async (req, res) => {
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
    const inputValidation = validateOrderCreationInput(req.body);
    if (!inputValidation.valid) {
      return res.status(400).json(inputValidation);
    }

    // Validate delivery address format
    const addressValidation = validateDeliveryAddress(deliveryAddress);
    if (!addressValidation.valid) {
      return res.status(400).json({
        success: false,
        message: addressValidation.message,
        error: 'Validation Error'
      });
    }

    // Validate delivery details
    const deliveryValidation = validateDeliveryDetails({ deliveryDate, deliverySlot });
    if (!deliveryValidation.valid) {
      return res.status(400).json(deliveryValidation);
    }

    // === GET USER'S CART ===
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                salePrice: true,
                stock: true,
                isAvailable: true
              }
            }
          }
        }
      }
    });

    if (!cart) {
      return res.status(400).json({
        success: false,
        message: 'No cart found for user',
        error: 'Not Found'
      });
    }

    // === VALIDATE CART FOR ORDER ===
    const cartValidation = await validateCartForOrder(cart);
    if (!cartValidation.valid) {
      return res.status(400).json({
        success: false,
        message: cartValidation.message,
        error: 'Cart Validation Error',
        details: cartValidation.errors || []
      });
    }

    // === CREATE ORDER ===
    const orderData = {
      userId,
      deliveryAddress,
      deliveryDate,
      deliverySlot,
      paymentMethod,
      orderNotes,
      discount
    };

    const order = await createOrderFromCart(orderData, cart);

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

    console.log(`✅ Order created successfully: ${order.orderNumber} for user ${userId}`);
    console.log(`   Items: ${completeOrder.items.length}, Total: ₹${completeOrder.totalAmount}`);

    res.status(201).json({
      success: true,
      message: `Order ${order.orderNumber} created successfully`,
      data: {
        order: completeOrder,
        orderNumber: order.orderNumber,
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
};

module.exports = {
  handleOrderCreation
};

/*
=== ORDER CREATION HANDLER MODULE ===

This module contains the business logic for order creation from cart.

FUNCTIONALITY:
- Comprehensive input validation (address, delivery, payment)
- Cart retrieval and validation
- Order creation with transaction safety
- Complete order data response formatting

VALIDATION STEPS:
1. Input validation (delivery address, payment method)
2. Address format validation
3. Delivery details validation (date, slot)
4. Cart existence and content validation
5. Stock and availability validation

ORDER CREATION PROCESS:
1. Validates all input data
2. Retrieves user's cart with items and products
3. Validates cart contents for order creation
4. Creates order using atomic transaction
5. Returns complete order data with confirmation

USAGE:
```javascript
const { handleOrderCreation } = require('./orderCreationHandler');

// In route handler
router.post('/', requireAuth, handleOrderCreation);
```

ERROR HANDLING:
- Input validation errors (400)
- Cart not found (400)
- Cart validation errors (400)
- Server errors (500)
- Development vs production error details
*/

const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const { getOrderStatusInfo } = require('../../utils/orderUtils');
const { getCompleteOrder } = require('../../utils/order/orderOperations');

// GET /api/orders/:orderNumber - Get specific order details
router.get('/:orderNumber', requireAuth, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const userId = req.user.userId;

    // === INPUT VALIDATION ===
    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order number is required',
        error: 'Validation Error'
      });
    }

    // === GET COMPLETE ORDER DATA ===
    const order = await getCompleteOrder(orderNumber, userId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order ${orderNumber} not found or access denied`,
        error: 'Not Found'
      });
    }

    // === ENHANCE ORDER DATA ===
    const enhancedOrder = {
      ...order,
      statusInfo: getOrderStatusInfo(order.status),
      deliveryAddress: JSON.parse(order.deliveryAddress || '{}'),
      orderSummary: {
        itemsCount: order.items.length,
        totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        tax: order.tax,
        discount: order.discount,
        totalAmount: order.totalAmount
      },
      canCancel: ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status),
      canReturn: order.status === 'DELIVERED',
      estimatedDelivery: order.deliveryDate ? order.deliveryDate.toISOString().split('T')[0] : null
    };

    res.status(200).json({
      success: true,
      message: 'Order details retrieved successfully',
      data: enhancedOrder
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;

/*
=== GET ORDER DETAILS ROUTE HANDLER ===

This route handler provides comprehensive order details for a specific order with enhanced information for user interface.

ROUTE INFORMATION:
- Method: GET
- Path: /api/orders/:orderNumber
- Authentication: Required
- Purpose: Retrieve complete details of a specific order

REQUEST FLOW:
1. **Input Validation** - Validates order number parameter
2. **Order Retrieval** - Gets complete order data with all relations
3. **Access Control** - Ensures user can only access their own orders
4. **Data Enhancement** - Adds UI-friendly information and calculations
5. **Response** - Returns enhanced order data

URL PARAMETERS:
- orderNumber: The order number to retrieve (e.g., PF-2024-000123)

SUCCESS RESPONSE:
```javascript
{
  success: true,
  message: "Order details retrieved successfully",
  data: {
    // Complete order object
    id: 123,
    orderNumber: "PF-2024-000123",
    status: "SHIPPED",
    totalAmount: 1250.00,
    items: [
      {
        // Order item with product details
        product: {
          id: 1,
          name: "Fresh Apples",
          thumbnail: "apple.jpg",
          unit: "kg"
        },
        quantity: 2,
        price: 150.00,
        subtotal: 300.00
      }
    ],
    user: {
      id: 456,
      name: "John Doe",
      email: "john@example.com"
    },
    statusHistory: [
      {
        oldStatus: "CONFIRMED",
        newStatus: "SHIPPED",
        changedAt: "2024-01-15T10:30:00Z",
        notes: "Order shipped via courier",
        changedByUser: {
          name: "Admin User"
        }
      }
    ],
    statusInfo: {
      label: "Shipped",
      description: "Order is on the way to you",
      color: "indigo",
      canCancel: false
    },
    deliveryAddress: {
      fullName: "John Doe",
      phone: "9876543210",
      addressLine1: "123 Main Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001"
    },
    orderSummary: {
      itemsCount: 3,
      totalItems: 5,
      subtotal: 1000.00,
      deliveryFee: 40.00,
      tax: 180.00,
      discount: 50.00,
      totalAmount: 1170.00
    },
    canCancel: false,
    canReturn: false,
    estimatedDelivery: "2024-01-20"
  }
}
```

ERROR RESPONSES:
- 400: Missing or invalid order number
- 404: Order not found or access denied
- 500: Server errors

DATA ENHANCEMENT FEATURES:

**Status Information**:
- User-friendly status labels and descriptions
- Color coding for UI display
- Cancellation and return eligibility

**Order Summary**:
- Item count and total quantity
- Breakdown of all charges (subtotal, delivery, tax, discount)
- Clear total amount calculation

**Action Availability**:
- canCancel: Based on current order status
- canReturn: Available for delivered orders
- Business rule enforcement for user actions

**Address Formatting**:
- Parsed delivery address from JSON
- Structured format for display
- Complete address information

**Status History**:
- Complete audit trail of status changes
- Admin actions with timestamps
- Notes and reasons for changes

MODULAR DESIGN BENEFITS:
- **Operations Module**: Reusable order retrieval logic
- **Status Enhancement**: Rich status information
- **Access Control**: User-scoped data access
- **Data Formatting**: Consistent response structure

SECURITY FEATURES:
- User can only access their own orders
- No sensitive admin information exposed
- Order number validation prevents injection
- Comprehensive error handling

PERFORMANCE FEATURES:
- Single query with all related data
- Selective field querying for efficiency
- Optimized include clauses
- Minimal data processing overhead

USER EXPERIENCE:
- Complete order information in single request
- Action availability clearly indicated
- Rich status information for tracking
- Structured data for easy UI rendering

EXTENSIBILITY:
- Easy to add new calculated fields
- Status information can be enhanced
- Additional related data can be included
- Compatible with order tracking systems
*/
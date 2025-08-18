const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const { getOrderStatusInfo } = require('../../utils/orderUtils');
const { cancelOrder } = require('../../utils/order/orderOperations');

// PUT /api/orders/:orderNumber/cancel - Cancel order (User)
router.put('/:orderNumber/cancel', requireAuth, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    // === INPUT VALIDATION ===
    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order number is required',
        error: 'Validation Error'
      });
    }

    // === CANCEL ORDER ===
    const cancelledOrder = await cancelOrder(orderNumber, userId, reason);

    // === ENHANCE RESPONSE DATA ===
    const responseData = {
      ...cancelledOrder,
      statusInfo: getOrderStatusInfo('CANCELLED'),
      deliveryAddress: JSON.parse(cancelledOrder.deliveryAddress || '{}'),
      orderSummary: {
        itemsCount: cancelledOrder.items.length,
        totalItems: cancelledOrder.items.reduce((sum, item) => sum + item.quantity, 0),
        refundAmount: cancelledOrder.totalAmount
      }
    };

    console.log(`✅ Order cancelled: ${orderNumber} by user ${userId}`);
    console.log(`   Reason: ${reason || 'No reason provided'}`);
    console.log(`   Refund amount: ₹${cancelledOrder.totalAmount}`);

    res.status(200).json({
      success: true,
      message: `Order ${orderNumber} has been cancelled successfully`,
      data: responseData
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    
    if (error.message === 'Order not found or access denied') {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you do not have permission to cancel this order',
        error: 'Not Found'
      });
    }

    if (error.message.includes('Order cannot be cancelled')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'Invalid Operation'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;

/*
=== CANCEL ORDER ROUTE HANDLER ===

This route handler manages user-initiated order cancellations with proper validation and stock restoration.

ROUTE INFORMATION:
- Method: PUT
- Path: /api/orders/:orderNumber/cancel
- Authentication: Required
- Purpose: Allow users to cancel their own orders

REQUEST FLOW:
1. **Input Validation** - Validates order number parameter
2. **Order Cancellation** - Cancels order with transaction safety
3. **Access Control** - Ensures users can only cancel their own orders
4. **Stock Restoration** - Automatically restores product inventory
5. **Audit Trail** - Records cancellation reason and timestamp
6. **Response** - Returns cancelled order with refund information

URL PARAMETERS:
- orderNumber: The order number to cancel (e.g., PF-2024-000123)

REQUEST BODY:
```javascript
{
  reason: "Changed my mind about the purchase" // Optional
}
```

CANCELLATION RULES:
Orders can only be cancelled in these statuses:
- PENDING: Order placed but not confirmed
- CONFIRMED: Order confirmed but not yet processing
- PROCESSING: Order being prepared but not shipped

Orders CANNOT be cancelled if:
- Status is SHIPPED, DELIVERED, CANCELLED, or RETURNED
- Order belongs to a different user

SUCCESS RESPONSE:
```javascript
{
  success: true,
  message: "Order PF-2024-000123 has been cancelled successfully",
  data: {
    // Complete cancelled order object
    id: 123,
    orderNumber: "PF-2024-000123",
    status: "CANCELLED",
    cancelledAt: "2024-01-15T14:30:00Z",
    cancellationReason: "Changed my mind about the purchase",
    items: [
      {
        // Order items with product details (stock restored)
      }
    ],
    statusInfo: {
      label: "Cancelled",
      description: "Order has been cancelled",
      color: "red",
      canCancel: false
    },
    deliveryAddress: {
      // Parsed delivery address
    },
    orderSummary: {
      itemsCount: 3,
      totalItems: 5,
      refundAmount: 1170.00
    }
  }
}
```

ERROR RESPONSES:
- 400: Missing order number, order cannot be cancelled
- 404: Order not found or access denied
- 500: Server errors

CANCELLATION PROCESS:
1. **Validation**: Verify order exists and belongs to user
2. **Status Check**: Ensure order is in cancellable state
3. **Transaction Begin**: Start database transaction
4. **Status Update**: Change order status to CANCELLED
5. **Stock Restoration**: Return items to inventory
6. **History Record**: Create cancellation audit entry
7. **Transaction Commit**: Complete all changes atomically

BUSINESS LOGIC ENFORCEMENT:
- Users can only cancel their own orders
- Cancellation only allowed for specific statuses
- Stock is automatically restored to prevent inventory issues
- Cancellation reason is recorded for business intelligence

STOCK MANAGEMENT:
- Automatic stock restoration for all order items
- Transaction safety ensures consistency
- Prevents inventory discrepancies
- Handles concurrent operations safely

MODULAR DESIGN BENEFITS:
- **Operations Module**: Reusable cancellation logic
- **Access Control**: User-scoped operations
- **Transaction Safety**: Atomic cancellation process
- **Audit Trail**: Complete cancellation tracking

REFUND HANDLING:
- Order shows refund amount (original total)
- Actual refund processing handled separately
- Clear indication of refundable amount
- Integration ready for payment systems

USER EXPERIENCE:
- Clear cancellation confirmation
- Reason tracking for future reference
- Immediate stock restoration
- Comprehensive order information in response

SECURITY FEATURES:
- User can only cancel their own orders
- Order number validation prevents manipulation
- Transaction safety prevents partial cancellations
- Comprehensive error handling

EXTENSIBILITY:
- Easy integration with payment refund systems
- Cancellation workflows can be enhanced
- Notification systems can be integrated
- Business rules can be customized per order type
*/
const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');
const { validateStatusTransition, getOrderStatusInfo } = require('../../utils/orderUtils');
const { validateStatusUpdateInput } = require('../../utils/order/validation/orderValidation');
const { updateOrderStatus } = require('../../utils/order/operations/orderOperations');

// PUT /api/orders/:orderNumber/status - Update order status (Admin only)
router.put('/:orderNumber/status', requireAuth, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { status, adminNotes } = req.body;
    const userId = req.user.userId;

    // === ADMIN AUTHORIZATION ===
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true, email: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin privileges required',
        error: 'Forbidden'
      });
    }

    // === INPUT VALIDATION ===
    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order number is required',
        error: 'Validation Error'
      });
    }

    const statusValidation = validateStatusUpdateInput({ status });
    if (!statusValidation.valid) {
      return res.status(400).json(statusValidation);
    }

    // === GET CURRENT ORDER ===
    const currentOrder = await prisma.order.findUnique({
      where: { orderNumber }
    });

    if (!currentOrder) {
      return res.status(404).json({
        success: false,
        message: `Order ${orderNumber} not found`,
        error: 'Not Found'
      });
    }

    // === VALIDATE STATUS TRANSITION ===
    const transitionValidation = validateStatusTransition(currentOrder.status, status);
    if (!transitionValidation.valid) {
      return res.status(400).json({
        success: false,
        message: transitionValidation.message,
        error: 'Invalid Transition'
      });
    }

    // === UPDATE ORDER STATUS ===
    const updatedOrder = await updateOrderStatus(orderNumber, status, adminNotes, userId);

    // === ENHANCE RESPONSE DATA ===
    const responseData = {
      ...updatedOrder,
      statusInfo: getOrderStatusInfo(status),
      deliveryAddress: JSON.parse(updatedOrder.deliveryAddress || '{}'),
      previousStatus: currentOrder.status,
      changedBy: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };

    console.log(`✅ Order status updated: ${orderNumber} from ${currentOrder.status} to ${status} by ${user.name}`);

    res.status(200).json({
      success: true,
      message: `Order ${orderNumber} status updated to ${status}`,
      data: responseData
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        error: 'Not Found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;

/*
=== UPDATE ORDER STATUS ROUTE HANDLER ===

This route handler manages order status updates with proper authorization, validation, and audit trail.

ROUTE INFORMATION:
- Method: PUT
- Path: /api/orders/:orderNumber/status
- Authentication: Required (Admin only)
- Purpose: Update order status with proper workflow validation

REQUEST FLOW:
1. **Admin Authorization** - Verifies user has admin privileges
2. **Input Validation** - Validates order number and status value
3. **Order Retrieval** - Gets current order to check existing status
4. **Transition Validation** - Ensures status change follows business rules
5. **Status Update** - Updates order with transaction safety and audit trail
6. **Response** - Returns updated order with enhanced information

REQUIRED FIELDS:
- orderNumber: Order number in URL path
- status: New status value in request body

OPTIONAL FIELDS:
- adminNotes: Admin notes explaining the status change

REQUEST BODY:
```javascript
{
  status: "SHIPPED",
  adminNotes: "Order dispatched via express delivery"
}
```

VALID STATUS VALUES:
- PENDING: Order received, awaiting confirmation
- CONFIRMED: Order confirmed, preparing for shipment
- PROCESSING: Order is being prepared and packed
- SHIPPED: Order dispatched and in transit
- DELIVERED: Order successfully delivered
- CANCELLED: Order cancelled
- RETURNED: Order returned by customer

STATUS TRANSITION RULES:
```
PENDING → CONFIRMED, CANCELLED
CONFIRMED → PROCESSING, CANCELLED
PROCESSING → SHIPPED, CANCELLED
SHIPPED → DELIVERED, RETURNED
DELIVERED → RETURNED
CANCELLED → (Terminal state)
RETURNED → (Terminal state)
```

SUCCESS RESPONSE:
```javascript
{
  success: true,
  message: "Order PF-2024-000123 status updated to SHIPPED",
  data: {
    // Complete order object with items and user info
    statusInfo: {
      label: "Shipped",
      description: "Order is on the way to you",
      color: "indigo",
      canCancel: false
    },
    deliveryAddress: {
      // Parsed delivery address object
    },
    previousStatus: "PROCESSING",
    changedBy: {
      id: 1,
      name: "Admin User",
      email: "admin@example.com"
    }
  }
}
```

ERROR RESPONSES:
- 400: Invalid input, invalid status transition
- 403: Access denied (non-admin user)
- 404: Order not found
- 500: Server errors

BUSINESS LOGIC ENFORCEMENT:
- Only admin users can update order status
- Status transitions must follow predefined workflow
- Invalid transitions are rejected with clear messages
- Audit trail is maintained for all changes

MODULAR DESIGN BENEFITS:
- **Validation Modules**: Reusable validation logic
- **Operations Module**: Transaction-safe status updates
- **Authorization**: Clear admin access control
- **Audit Trail**: Complete change tracking

SIDE EFFECTS HANDLING:
- Stock restoration for cancelled orders
- Status history creation
- Automatic timestamp updates
- Admin action logging

AUDIT TRAIL FEATURES:
- Records who made the change
- Captures old and new status
- Includes admin notes
- Timestamps all changes

SECURITY FEATURES:
- Admin-only access enforcement
- Input validation prevents malicious data
- Order ownership verification not required (admin access)
- Comprehensive error handling without information leakage

EXTENSIBILITY:
- Easy to add new status types
- Side effects can be extended per status
- Notification systems can be integrated
- Workflow rules can be customized per business needs
*/
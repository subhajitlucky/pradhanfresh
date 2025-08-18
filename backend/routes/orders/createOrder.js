const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const { handleOrderCreation } = require('../../utils/order/orderCreationHandler');

// POST /api/orders/create - Create order from cart
router.post('/', requireAuth, handleOrderCreation);

module.exports = router;

/*
=== CREATE ORDER ROUTE ===

This route handles order creation from user's cart.

ROUTE INFORMATION:
- Method: POST
- Path: /api/orders/create
- Authentication: Required
- Handler: handleOrderCreation (in orderCreationHandler.js)

REQUEST BODY:
```javascript
{
  deliveryAddress: {
    fullName: "John Doe",
    phone: "9876543210",
    addressLine1: "123 Main St",
    addressLine2: "Apt 4B",
    city: "Mumbai",
    state: "Maharashtra",  
    pincode: "400001",
    landmark: "Near Mall"
  },
  deliveryDate: "2024-01-20", // Optional
  deliverySlot: "MORNING",     // Optional
  paymentMethod: "COD",        // Default: COD
  orderNotes: "Handle with care", // Optional
  discount: 0                  // Default: 0
}
```

RESPONSE:
```javascript
{
  success: true,
  message: "Order PF-2024-000123 created successfully",
  data: {
    order: {  complete order object  },
    orderNumber: "PF-2024-000123",
    totalAmount: 1170.00,
    itemsCount: 3,
    estimatedDelivery: "2024-01-20",
    paymentMethod: "COD"
  }
}
```

BUSINESS LOGIC:
All order creation logic is handled in the orderCreationHandler module for better maintainability and testability.
*/
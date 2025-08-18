// Import all order utility functions from modular files
const { generateOrderNumber } = require('./order/orderNumber');
const { calculateOrderTotals, calculateItemSubtotal, calculateDeliveryFee } = require('./order/calculations');
const { validateStatusTransition, validateCartForOrder, validateDeliveryAddress } = require('./order/validation');
const { updateProductStock } = require('./order/stockManagement');
const { getOrderStatusInfo } = require('./order/statusInfo');

// Re-export all functions for backward compatibility
module.exports = {
  generateOrderNumber,
  calculateOrderTotals,
  calculateItemSubtotal,
  validateStatusTransition,
  validateCartForOrder,
  updateProductStock,
  getOrderStatusInfo,
  validateDeliveryAddress,
  calculateDeliveryFee
};

/*
=== CONSOLIDATED ORDER UTILITIES ===

This file serves as the main entry point for all order-related utility functions.
The original large orderUtils.js file has been broken down into smaller, focused modules
for better maintainability and understanding.

MODULE BREAKDOWN:

1. **order/orderNumber.js** - Order number generation
   - generateOrderNumber() - Creates unique sequential order numbers

2. **order/calculations.js** - Financial calculations
   - calculateOrderTotals() - Computes order totals with tax, delivery, discount
   - calculateItemSubtotal() - Calculates individual item subtotals
   - calculateDeliveryFee() - Determines shipping charges

3. **order/validation.js** - Validation logic
   - validateStatusTransition() - Ensures valid order status changes
   - validateCartForOrder() - Validates cart before order creation
   - validateDeliveryAddress() - Validates delivery address format

4. **order/stockManagement.js** - Inventory management
   - updateProductStock() - Updates product stock levels

5. **order/statusInfo.js** - Status display information
   - getOrderStatusInfo() - Provides UI-friendly status information

BENEFITS OF MODULAR STRUCTURE:
- **Better Organization**: Related functions grouped together
- **Easier Maintenance**: Smaller files are easier to understand and modify
- **Improved Testing**: Each module can be tested independently
- **Reduced Complexity**: Each file focuses on a single responsibility
- **Better Documentation**: Each module has focused documentation

BACKWARD COMPATIBILITY:
This file maintains the same export interface as the original orderUtils.js,
so existing code that imports these functions will continue to work without changes.

USAGE EXAMPLE:
```javascript
const { generateOrderNumber, calculateOrderTotals, validateCartForOrder } = require('../utils/orderUtils');

// All functions work exactly as before
const orderNumber = await generateOrderNumber();
const totals = calculateOrderTotals(orderItems, { deliveryFee: 40, tax: 18 });
const validation = await validateCartForOrder(cart);
```

FUTURE ENHANCEMENTS:
- Each module can be independently enhanced or refactored
- New order-related functionality can be added to appropriate modules
- Modules can be easily unit tested in isolation
- Code reuse across different parts of the application is simplified
*/
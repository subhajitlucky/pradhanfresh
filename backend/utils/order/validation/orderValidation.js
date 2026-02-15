// Re-export all order validation functions from focused modules
const { validateOrderCreationInput, validateDeliveryDetails, validateStatusUpdateInput } = require('./inputValidation');
const { validatePaginationParams, validateSortParams } = require('./parameterValidation');

module.exports = {
  validateOrderCreationInput,
  validateDeliveryDetails,
  validateStatusUpdateInput,
  validatePaginationParams,
  validateSortParams
};

/*
=== ORDER VALIDATION MODULE ===

This module provides a unified interface for all order validation functions.

AVAILABLE FUNCTIONS:
- validateOrderCreationInput: Validate basic order creation data
- validateDeliveryDetails: Validate delivery dates and time slots
- validateStatusUpdateInput: Validate order status changes
- validatePaginationParams: Validate pagination parameters
- validateSortParams: Validate sorting parameters

USAGE:
```javascript
const orderValidation = require('./orderValidation');

// Validate order creation
const orderResult = orderValidation.validateOrderCreationInput(data);

// Validate delivery details
const deliveryResult = orderValidation.validateDeliveryDetails(delivery);

// Validate pagination
const paginationResult = orderValidation.validatePaginationParams(params);
```

MODULAR DESIGN:
- inputValidation.js: Order creation and delivery validation
- parameterValidation.js: Query parameter validation
*/
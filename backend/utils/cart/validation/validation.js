/**
 * Validate input data for adding items to cart
 * @param {Object} data - Input data from request
 * @returns {Object} Validation result
 */
const validateAddToCartInput = (data) => {
  const { productId, quantity = 1 } = data;
  
  // Check if productId is provided
  if (!productId) {
    return {
      valid: false,
      message: 'Product ID is required',
      error: 'Validation Error'
    };
  }

  const parsedProductId = parseInt(productId);
  const parsedQuantity = parseInt(quantity);

  // Validate product ID
  if (isNaN(parsedProductId) || parsedProductId <= 0) {
    return {
      valid: false,
      message: 'Invalid product ID',
      error: 'Validation Error'
    };
  }

  // Validate quantity
  if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
    return {
      valid: false,
      message: 'Quantity must be a positive number',
      error: 'Validation Error'
    };
  }

  // Check maximum quantity limit
  if (parsedQuantity > 99) {
    return {
      valid: false,
      message: 'Maximum quantity per item is 99',
      error: 'Validation Error'
    };
  }

  return {
    valid: true,
    data: {
      productId: parsedProductId,
      quantity: parsedQuantity
    }
  };
};

module.exports = {
  validateAddToCartInput
};

/*
=== CART VALIDATION MODULE ===

This module handles input validation for cart operations, specifically for adding items to cart.

KEY VALIDATION RULES:

1. **Product ID Validation**:
   - Must be provided (not null/undefined)
   - Must be a positive integer
   - Must be greater than 0

2. **Quantity Validation**:
   - Must be a positive integer
   - Must be greater than 0
   - Maximum limit of 99 items per product (business rule)

3. **Data Parsing**:
   - Safely converts string inputs to integers
   - Handles edge cases like NaN or invalid numbers

VALIDATION RESPONSE FORMAT:
```javascript
// Success response
{
  valid: true,
  data: {
    productId: 123,
    quantity: 2
  }
}

// Error response
{
  valid: false,
  message: "Error description",
  error: "Error category"
}
```

USAGE EXAMPLE:
```javascript
const { validateAddToCartInput } = require('../utils/cart/validation');

const validation = validateAddToCartInput({
  productId: "123",
  quantity: "2"
});

if (!validation.valid) {
  return res.status(400).json({
    success: false,
    message: validation.message,
    error: validation.error
  });
}

const { productId, quantity } = validation.data;
```

BUSINESS RULES ENFORCED:
- Maximum 99 items per product prevents cart abuse
- Positive quantities only (no negative or zero values)
- Integer-only quantities (no decimal quantities)
- Product ID must be valid for database lookup

ERROR CATEGORIES:
- "Validation Error": Input format or range issues
- Clear, user-friendly error messages
- Consistent error response structure

SECURITY CONSIDERATIONS:
- Input sanitization through parseInt()
- Prevents SQL injection through type conversion
- Range validation prevents system abuse
- No sensitive information in error messages
*/

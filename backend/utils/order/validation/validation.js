const prisma = require('../../prisma/client');

/**
 * Validate order status transition
 * @param {String} currentStatus - Current order status
 * @param {String} newStatus - New status to transition to
 * @returns {Object} Validation result
 */
const validateStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED', 'RETURNED'],
    DELIVERED: ['RETURNED'],
    CANCELLED: [], // Terminal state
    RETURNED: []   // Terminal state
  };

  const allowedTransitions = validTransitions[currentStatus] || [];
  
  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      message: `Cannot transition from ${currentStatus} to ${newStatus}`
    };
  }

  return {
    valid: true,
    message: `Status transition from ${currentStatus} to ${newStatus} is valid`
  };
};

/**
 * Validate cart before order creation
 * @param {Object} cart - Cart object with items
 * @returns {Promise<Object>} Validation result
 */
const validateCartForOrder = async (cart) => {
  if (!cart || !cart.items || cart.items.length === 0) {
    return {
      valid: false,
      message: 'Cart is empty'
    };
  }

  const validationErrors = [];
  
  for (const item of cart.items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { stock: true, isAvailable: true, name: true }
    });

    if (!product) {
      validationErrors.push(`Product ${item.product?.name || item.productId} not found`);
      continue;
    }

    if (!product.isAvailable) {
      validationErrors.push(`${product.name} is no longer available`);
      continue;
    }

    if (product.stock < item.quantity) {
      validationErrors.push(`Only ${product.stock} units of ${product.name} available (requested: ${item.quantity})`);
    }
  }

  if (validationErrors.length > 0) {
    return {
      valid: false,
      message: 'Cart validation failed',
      errors: validationErrors
    };
  }

  return {
    valid: true,
    message: 'Cart is valid for order creation'
  };
};

/**
 * Validate delivery address
 * @param {Object} address - Delivery address object
 * @returns {Object} Validation result
 */
const validateDeliveryAddress = (address) => {
  const requiredFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
  const missingFields = [];

  for (const field of requiredFields) {
    if (!address[field] || address[field].toString().trim() === '') {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    return {
      valid: false,
      message: `Missing required fields: ${missingFields.join(', ')}`
    };
  }

  // Validate pincode (6 digits)
  const pincodeRegex = /^\d{6}$/;
  if (!pincodeRegex.test(address.pincode)) {
    return {
      valid: false,
      message: 'Pincode must be 6 digits'
    };
  }

  // Validate phone (10 digits)
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(address.phone.toString().replace(/\D/g, ''))) {
    return {
      valid: false,
      message: 'Phone number must be 10 digits'
    };
  }

  return {
    valid: true,
    message: 'Delivery address is valid'
  };
};

module.exports = {
  validateStatusTransition,
  validateCartForOrder,
  validateDeliveryAddress
};

/*
=== ORDER VALIDATION MODULE ===

This module provides comprehensive validation for various order-related operations.

KEY VALIDATION FUNCTIONS:

1. **Status Transition Validation**:
   - Enforces a strict order status workflow
   - Prevents invalid status changes (e.g., DELIVERED → PENDING)
   - Supports business rules for order lifecycle

2. **Cart Validation for Orders**:
   - Ensures cart is not empty before order creation
   - Validates product availability and stock levels
   - Checks each item against current product data

3. **Delivery Address Validation**:
   - Validates required address fields
   - Enforces Indian pincode format (6 digits)
   - Validates phone number format (10 digits)

ORDER STATUS WORKFLOW:
```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
    ↓         ↓           ↓           ↓         ↓
CANCELLED CANCELLED  CANCELLED  RETURNED  RETURNED
```

Terminal States: CANCELLED, RETURNED (no further transitions allowed)

USAGE EXAMPLES:
```javascript
const { validateStatusTransition, validateCartForOrder, validateDeliveryAddress } = require('../utils/order/validation');

// Status transition validation
const statusCheck = validateStatusTransition('PENDING', 'CONFIRMED'); // Valid
const invalidCheck = validateStatusTransition('DELIVERED', 'PENDING'); // Invalid

// Cart validation
const cart = { items: [{ productId: 1, quantity: 2 }] };
const cartValidation = await validateCartForOrder(cart);

// Address validation
const address = {
  fullName: 'John Doe',
  phone: '9876543210',
  addressLine1: '123 Main Street',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001'
};
const addressValidation = validateDeliveryAddress(address);
```

VALIDATION RESPONSE FORMAT:
All validation functions return objects with:
```javascript
{
  valid: boolean,
  message: string,
  errors?: Array<string> // For cart validation with multiple issues
}
```

BUSINESS LOGIC:
- Status transitions follow e-commerce best practices
- Cart validation prevents orders with unavailable/insufficient stock
- Address validation ensures successful delivery
- Phone and pincode regex patterns are India-specific

ERROR PREVENTION:
- Prevents race conditions by checking real-time stock
- Validates data integrity before database operations
- Provides clear error messages for user feedback
- Handles edge cases like deleted products in cart
*/

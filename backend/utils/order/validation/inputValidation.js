/**
 * Validate order creation input
 * @param {Object} data - Order creation data
 * @returns {Object} Validation result
 */
const validateOrderCreationInput = (data) => {
  const { deliveryAddress, paymentMethod } = data;

  // Check delivery address
  if (!deliveryAddress) {
    return {
      valid: false,
      message: 'Delivery address is required',
      error: 'Validation Error'
    };
  }

  // Validate payment method
  const validPaymentMethods = ['COD', 'ONLINE', 'WALLET'];
  if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
    return {
      valid: false,
      message: 'Invalid payment method. Must be COD, ONLINE, or WALLET',
      error: 'Validation Error'
    };
  }

  return { valid: true };
};

/**
 * Validate delivery date and slot
 * @param {Object} delivery - Delivery information
 * @returns {Object} Validation result
 */
const validateDeliveryDetails = (delivery) => {
  const { deliveryDate, deliverySlot } = delivery;

  if (deliveryDate) {
    const selectedDate = new Date(deliveryDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (selectedDate < tomorrow) {
      return {
        valid: false,
        message: 'Delivery date must be at least tomorrow',
        error: 'Validation Error'
      };
    }

    // Check if date is too far in future (optional business rule)
    const maxDays = 30;
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + maxDays);

    if (selectedDate > maxDate) {
      return {
        valid: false,
        message: `Delivery date cannot be more than ${maxDays} days in advance`,
        error: 'Validation Error'
      };
    }
  }

  if (deliverySlot) {
    const validSlots = ['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME'];
    if (!validSlots.includes(deliverySlot)) {
      return {
        valid: false,
        message: 'Invalid delivery slot. Must be MORNING, AFTERNOON, EVENING, or ANYTIME',
        error: 'Validation Error'
      };
    }
  }

  return { valid: true };
};

/**
 * Validate order status update
 * @param {Object} data - Status update data
 * @returns {Object} Validation result
 */
const validateStatusUpdateInput = (data) => {
  const { status } = data;

  if (!status) {
    return {
      valid: false,
      message: 'Status is required',
      error: 'Validation Error'
    };
  }

  const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];
  if (!validStatuses.includes(status)) {
    return {
      valid: false,
      message: 'Invalid status value',
      error: 'Validation Error'
    };
  }

  return { valid: true };
};

module.exports = {
  validateOrderCreationInput,
  validateDeliveryDetails,
  validateStatusUpdateInput
};

/*
=== ORDER INPUT VALIDATION MODULE ===

This module handles validation of order-related input data.

VALIDATION FUNCTIONS:
- validateOrderCreationInput: Validates basic order creation data
- validateDeliveryDetails: Validates delivery dates and time slots  
- validateStatusUpdateInput: Validates order status changes

USAGE:
```javascript
const { validateOrderCreationInput, validateDeliveryDetails, validateStatusUpdateInput } = require('./inputValidation');

// Validate order creation
const orderValidation = validateOrderCreationInput(orderData);

// Validate delivery details
const deliveryValidation = validateDeliveryDetails({ deliveryDate, deliverySlot });

// Validate status update
const statusValidation = validateStatusUpdateInput({ status });
```

BUSINESS RULES ENFORCED:
- Delivery address is required for all orders
- Payment methods must be COD, ONLINE, or WALLET
- Delivery date must be at least tomorrow
- Delivery date cannot be more than 30 days in advance
- Delivery slots must be valid predefined values
- Order statuses must be from valid list
*/

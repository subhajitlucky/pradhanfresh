/**
 * Validate pagination parameters for orders
 * @param {Object} params - Pagination parameters
 * @returns {Object} Validation result
 */
const validatePaginationParams = (params) => {
  const { page, limit } = params;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) {
    return {
      valid: false,
      message: 'Invalid page number',
      error: 'Validation Error'
    };
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
    return {
      valid: false,
      message: 'Limit must be between 1 and 50',
      error: 'Validation Error'
    };
  }

  return { 
    valid: true, 
    data: { page: pageNum, limit: limitNum }
  };
};

/**
 * Validate sort parameters for orders
 * @param {Object} params - Sort parameters
 * @returns {Object} Validation result
 */
const validateSortParams = (params) => {
  const { sortBy, sortOrder } = params;

  const validSortFields = ['createdAt', 'updatedAt', 'totalAmount', 'status'];
  if (sortBy && !validSortFields.includes(sortBy)) {
    return {
      valid: false,
      message: 'Invalid sort field',
      error: 'Validation Error'
    };
  }

  const validSortOrders = ['asc', 'desc'];
  if (sortOrder && !validSortOrders.includes(sortOrder)) {
    return {
      valid: false,
      message: 'Invalid sort order',
      error: 'Validation Error'
    };
  }

  return { valid: true };
};

module.exports = {
  validatePaginationParams,
  validateSortParams
};

/*
=== ORDER PARAMETER VALIDATION MODULE ===

This module handles validation of query parameters for order operations.

VALIDATION FUNCTIONS:
- validatePaginationParams: Validates page and limit parameters
- validateSortParams: Validates sorting field and order parameters

USAGE:
```javascript
const { validatePaginationParams, validateSortParams } = require('./parameterValidation');

// Validate pagination
const paginationValidation = validatePaginationParams({ page: 1, limit: 10 });

// Validate sorting
const sortValidation = validateSortParams({ sortBy: 'createdAt', sortOrder: 'desc' });
```

VALIDATION RULES:
- Page must be a positive integer
- Limit must be between 1 and 50
- Sort field must be from predefined list (createdAt, updatedAt, totalAmount, status)
- Sort order must be 'asc' or 'desc'

FEATURES:
- Returns parsed integer values for pagination
- Prevents excessive page limits
- Ensures only valid sort fields are used
*/

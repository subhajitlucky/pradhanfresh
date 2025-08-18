const prisma = require('../../prisma/client');

/**
 * Validate required fields for product creation
 * @param {Object} data - Product data
 * @returns {Object} Validation result
 */
const validateRequiredFields = (data) => {
  const requiredFields = ['name', 'description', 'price', 'categoryId', 'thumbnail', 'sku', 'unit'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      message: `Missing required fields: ${missingFields.join(', ')}`,
      missingFields: missingFields,
      error: 'Validation Error'
    };
  }

  return { valid: true };
};

/**
 * Validate product pricing
 * @param {Object} pricing - Pricing data
 * @returns {Object} Validation result
 */
const validatePricing = (pricing) => {
  const { price, salePrice } = pricing;

  // Validate regular price
  if (price !== undefined) {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return {
        valid: false,
        message: 'Price must be a positive number',
        error: 'Validation Error'
      };
    }
  }

  // Validate sale price
  if (salePrice !== undefined && salePrice !== null && salePrice !== '') {
    const parsedSalePrice = parseFloat(salePrice);
    if (isNaN(parsedSalePrice) || parsedSalePrice <= 0) {
      return {
        valid: false,
        message: 'Sale price must be a positive number',
        error: 'Validation Error'
      };
    }

    const currentPrice = parseFloat(price);
    if (parsedSalePrice >= currentPrice) {
      return {
        valid: false,
        message: 'Sale price must be less than regular price',
        error: 'Validation Error'
      };
    }
  }

  return { valid: true };
};

/**
 * Validate category exists
 * @param {Number} categoryId - Category ID
 * @returns {Promise<Object>} Validation result
 */
const validateCategory = async (categoryId) => {
  const parsedCategoryId = parseInt(categoryId);
  if (isNaN(parsedCategoryId)) {
    return {
      valid: false,
      message: 'Category ID must be a number',
      error: 'Validation Error'
    };
  }

  const categoryExists = await prisma.category.findUnique({
    where: { id: parsedCategoryId }
  });

  if (!categoryExists) {
    return {
      valid: false,
      message: `Category with ID ${parsedCategoryId} does not exist`,
      error: 'Validation Error'
    };
  }

  return { valid: true, categoryId: parsedCategoryId };
};

/**
 * Validate stock amount
 * @param {Number} stock - Stock amount
 * @returns {Object} Validation result
 */
const validateStock = (stock) => {
  const parsedStock = parseInt(stock) || 0;
  if (parsedStock < 0) {
    return {
      valid: false,
      message: 'Stock cannot be negative',
      error: 'Validation Error'
    };
  }

  return { valid: true, stock: parsedStock };
};

/**
 * Validate SKU uniqueness
 * @param {String} sku - Product SKU
 * @param {Number} excludeProductId - Product ID to exclude from check (for updates)
 * @returns {Promise<Object>} Validation result
 */
const validateSKUUniqueness = async (sku, excludeProductId = null) => {
  const normalizedSKU = sku.trim().toUpperCase();
  
  const existingSKU = await prisma.product.findUnique({
    where: { sku: normalizedSKU }
  });

  if (existingSKU && (!excludeProductId || existingSKU.id !== excludeProductId)) {
    return {
      valid: false,
      message: `Product with SKU '${sku}' already exists`,
      error: 'Conflict'
    };
  }

  return { valid: true, sku: normalizedSKU };
};

module.exports = {
  validateRequiredFields,
  validatePricing,
  validateCategory,
  validateStock,
  validateSKUUniqueness
};

/*
=== PRODUCT VALIDATION MODULE ===

This module provides comprehensive validation for product data across creation and update operations.

KEY VALIDATION FUNCTIONS:

1. **Required Fields Validation**:
   - Checks for presence of mandatory product fields
   - Returns list of missing fields for user feedback
   - Essential for product creation workflow

2. **Pricing Validation**:
   - Validates regular price and sale price formats
   - Ensures sale price is less than regular price
   - Handles optional sale price scenarios

3. **Category Validation**:
   - Verifies category ID is valid integer
   - Checks category exists in database
   - Prevents orphaned product records

4. **Stock Validation**:
   - Ensures stock is non-negative integer
   - Defaults to 0 if not provided
   - Prevents negative inventory scenarios

5. **SKU Uniqueness Validation**:
   - Checks SKU uniqueness across products
   - Supports exclusion for update operations
   - Normalizes SKU to uppercase for consistency

VALIDATION RESPONSE FORMAT:
All validation functions return consistent response objects:
```javascript
{
  valid: boolean,
  message?: string,
  error?: string,
  data?: any // Additional validated data
}
```

USAGE EXAMPLES:
```javascript
const { validateRequiredFields, validatePricing, validateCategory } = require('../utils/product/validation');

// Validate required fields
const fieldsCheck = validateRequiredFields(productData);
if (!fieldsCheck.valid) {
  return res.status(400).json(fieldsCheck);
}

// Validate pricing
const pricingCheck = validatePricing({ price: 100, salePrice: 80 });
if (!pricingCheck.valid) {
  return res.status(400).json(pricingCheck);
}

// Validate category (async)
const categoryCheck = await validateCategory(categoryId);
if (!categoryCheck.valid) {
  return res.status(400).json(categoryCheck);
}
```

BUSINESS RULES ENFORCED:
- All products must have essential information (name, price, category, etc.)
- Sale prices must be lower than regular prices
- Categories must exist before products can reference them
- Stock levels cannot be negative
- SKUs must be unique across all products

ERROR HANDLING:
- Database connection errors bubble up to calling functions
- Input type conversion is handled safely
- Missing or invalid data returns descriptive error messages
- Validation failures include error categories for proper HTTP responses

EXTENSIBILITY:
- Easy to add new validation rules
- Validation functions are composable and reusable
- Supports both creation and update scenarios
- Can be extended for additional business rules (weight validation, image validation, etc.)
*/

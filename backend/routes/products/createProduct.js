const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');
const requireAdmin = require('../../middleware/requireAdmin');
const { validateRequiredFields, validatePricing, validateCategory, validateStock, validateSKUUniqueness } = require('../../utils/product/validation');
const { generateUniqueSlug } = require('../../utils/product/support/slug');
const { prepareProductData } = require('../../utils/product/support/dataPreparation');

// POST /api/products - Create new product (Admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    // === VALIDATION LAYER 1: REQUIRED FIELDS ===
    const requiredFieldsCheck = validateRequiredFields(req.body);
    if (!requiredFieldsCheck.valid) {
      return res.status(400).json(requiredFieldsCheck);
    }

    // === VALIDATION LAYER 2: DATA TYPE VALIDATION ===
    const pricingCheck = validatePricing(req.body);
    if (!pricingCheck.valid) {
      return res.status(400).json(pricingCheck);
    }

    const categoryCheck = await validateCategory(req.body.categoryId);
    if (!categoryCheck.valid) {
      return res.status(400).json(categoryCheck);
    }

    const stockCheck = validateStock(req.body.stock);
    if (!stockCheck.valid) {
      return res.status(400).json(stockCheck);
    }

    // === VALIDATION LAYER 3: BUSINESS LOGIC VALIDATION ===
    const skuCheck = await validateSKUUniqueness(req.body.sku);
    if (!skuCheck.valid) {
      return res.status(409).json(skuCheck);
    }

    // === GENERATE UNIQUE SLUG ===
    const slug = await generateUniqueSlug(req.body.name);

    // === PREPARE PRODUCT DATA ===
    const productData = prepareProductData(req.body, slug, req.user.userId);

    // === CREATE PRODUCT IN DATABASE ===
    const newProduct = await prisma.product.create({
      data: productData,
      include: {
        category: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct
    });

  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Product with this SKU or slug already exists',
        error: 'Conflict'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;

/*
=== CREATE PRODUCT ROUTE HANDLER ===

This route handler manages the creation of new products with comprehensive validation and data preparation.

ROUTE INFORMATION:
- Method: POST
- Path: /api/products
- Authentication: Required (Admin only)
- Purpose: Create new products in the system

REQUEST FLOW:
1. **Authentication Check** - Middleware validates admin privileges
2. **Required Fields Validation** - Ensures all mandatory fields are present
3. **Data Type Validation** - Validates pricing, category, and stock data
4. **Business Logic Validation** - Checks SKU uniqueness and business rules
5. **Slug Generation** - Creates unique URL-friendly slug
6. **Data Preparation** - Formats and normalizes data for database
7. **Database Creation** - Creates product with related data
8. **Response** - Returns created product with relations

REQUIRED FIELDS:
- name: Product name
- description: Detailed product description
- price: Product price (positive number)
- categoryId: Valid category ID
- thumbnail: Product thumbnail image URL
- sku: Unique product SKU
- unit: Product unit (kg, piece, etc.)

OPTIONAL FIELDS:
- shortDescription: Brief product description
- salePrice: Discounted price (must be less than regular price)
- images: Array of product images
- stock: Stock quantity (defaults to 0)
- weight: Product weight
- isFeatured: Featured product flag
- isOrganic: Organic product flag

VALIDATION LAYERS:
1. **Required Fields**: Checks presence of mandatory data
2. **Data Types**: Validates format and type of all fields
3. **Business Logic**: Ensures SKU uniqueness and category existence
4. **Database Constraints**: Prisma handles final constraint validation

SUCCESS RESPONSE:
```javascript
{
  success: true,
  message: "Product created successfully",
  data: {
    // Complete product object with category and creator info
  }
}
```

ERROR RESPONSES:
- 400: Validation errors, missing fields, invalid data
- 409: Conflict errors (duplicate SKU, slug)
- 500: Server errors

MODULAR DESIGN BENEFITS:
- **Validation Module**: Reusable validation logic across routes
- **Slug Module**: Consistent URL generation
- **Data Preparation**: Standardized data formatting
- **Error Handling**: Comprehensive error coverage
- **Maintainability**: Clear separation of concerns

BUSINESS RULES ENFORCED:
- SKUs must be unique across all products
- Sale prices must be lower than regular prices
- Categories must exist before products can reference them
- Stock levels determine product availability
- Slugs are automatically generated and made unique

SECURITY FEATURES:
- Admin-only access through middleware
- Input validation prevents malicious data
- SQL injection prevention through Prisma ORM
- Data sanitization and normalization

EXTENSIBILITY:
- Easy to add new validation rules
- Modular structure supports additional business logic
- Can be extended for image processing, inventory tracking, etc.
- Compatible with different product types and categories
*/
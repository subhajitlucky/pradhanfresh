const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');
const requireAdmin = require('../../middleware/requireAdmin');
const { validatePricing, validateCategory, validateStock, validateSKUUniqueness } = require('../../utils/product/validation');
const { generateUniqueSlug } = require('../../utils/product/slug');
const { prepareUpdateData } = require('../../utils/product/dataPreparation');

// PUT /api/products/:id - Update existing product (Admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    // === STEP 1: VALIDATE PRODUCT ID ===
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product ID must be a valid number',
        error: 'Validation Error'
      });
    }

    // === STEP 2: CHECK IF PRODUCT EXISTS ===
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
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

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${productId} not found`,
        error: 'Not Found'
      });
    }

    // === STEP 3: VALIDATE UPDATE DATA ===
    
    // Validate pricing if provided
    if (req.body.price !== undefined || req.body.salePrice !== undefined) {
      const currentPrice = req.body.price !== undefined ? req.body.price : existingProduct.price;
      const pricingCheck = validatePricing({ 
        price: currentPrice, 
        salePrice: req.body.salePrice 
      });
      if (!pricingCheck.valid) {
        return res.status(400).json(pricingCheck);
      }
    }

    // Validate category if provided
    if (req.body.categoryId !== undefined) {
      const categoryCheck = await validateCategory(req.body.categoryId);
      if (!categoryCheck.valid) {
        return res.status(400).json(categoryCheck);
      }
    }

    // Validate stock if provided
    if (req.body.stock !== undefined) {
      const stockCheck = validateStock(req.body.stock);
      if (!stockCheck.valid) {
        return res.status(400).json(stockCheck);
      }
    }

    // Validate SKU uniqueness if changing
    if (req.body.sku !== undefined) {
      const skuCheck = await validateSKUUniqueness(req.body.sku, productId);
      if (!skuCheck.valid) {
        return res.status(409).json(skuCheck);
      }
    }

    // === STEP 4: GENERATE NEW SLUG IF NAME CHANGED ===
    let newSlug = null;
    if (req.body.name !== undefined && req.body.name.trim() !== existingProduct.name) {
      newSlug = await generateUniqueSlug(req.body.name, productId);
    }

    // === STEP 5: PREPARE UPDATE DATA ===
    const updateData = prepareUpdateData(req.body, existingProduct, newSlug);

    // Only proceed if there are actual changes
    if (Object.keys(updateData).length <= 1) { // <= 1 because updatedAt is always added
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update',
        error: 'Validation Error'
      });
    }

    // === STEP 6: UPDATE PRODUCT IN DATABASE ===
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
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

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
      changedFields: Object.keys(updateData).filter(key => key !== 'updatedAt')
    });

  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Product with this SKU or slug already exists',
        error: 'Conflict'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;

/*
=== UPDATE PRODUCT ROUTE HANDLER ===

This route handler manages updates to existing products with comprehensive validation and data preparation.

ROUTE INFORMATION:
- Method: PUT
- Path: /api/products/:id
- Authentication: Required (Admin only)
- Purpose: Update existing products in the system

REQUEST FLOW:
1. **Product ID Validation** - Ensures valid numeric product ID
2. **Existence Check** - Verifies product exists in database
3. **Field Validation** - Validates only provided fields (partial updates)
4. **Business Logic Validation** - Checks constraints and uniqueness
5. **Slug Generation** - Creates new slug if name changed
6. **Data Preparation** - Formats update data maintaining existing values
7. **Database Update** - Updates only changed fields
8. **Response** - Returns updated product with change summary

UPDATE CAPABILITIES:
- **Partial Updates**: Only provided fields are updated
- **Name Changes**: Automatically generates new slug when name changes
- **Price Updates**: Validates pricing relationships
- **Stock Updates**: Automatically updates availability status
- **Category Changes**: Validates new category exists
- **SKU Changes**: Ensures new SKU is unique

VALIDATION STRATEGY:
- Only validates fields that are actually being updated
- Maintains existing values for unchanged fields
- Preserves data integrity through business rule enforcement
- Handles special cases like clearing sale prices

SUPPORTED UPDATES:
- name: Product name (triggers slug regeneration)
- description: Product description
- shortDescription: Brief description (can be cleared)
- price: Regular price
- salePrice: Sale price (can be cleared by setting to null/empty)
- categoryId: Product category
- images: Product images array
- thumbnail: Main product image
- stock: Stock quantity (auto-updates availability)
- sku: Product SKU (must remain unique)
- unit: Product unit
- weight: Product weight (can be cleared)
- isFeatured: Featured status
- isOrganic: Organic certification status

BUSINESS RULES:
- Sale price must be less than regular price (if both provided)
- New SKUs must be unique across all products
- Category must exist before assignment
- Stock changes automatically update availability
- Name changes trigger slug regeneration
- All text fields are normalized and trimmed

SUCCESS RESPONSE:
```javascript
{
  success: true,
  message: "Product updated successfully",
  data: {
    // Complete updated product object
  },
  changedFields: ["name", "price", "stock"] // List of fields that were changed
}
```

ERROR RESPONSES:
- 400: Invalid product ID, validation errors, no changes provided
- 404: Product not found
- 409: Conflict errors (duplicate SKU)
- 500: Server errors

MODULAR DESIGN BENEFITS:
- **Validation Modules**: Reusable validation logic
- **Data Preparation**: Handles complex update logic
- **Slug Management**: Consistent URL generation
- **Error Handling**: Comprehensive error coverage
- **Change Tracking**: Reports what fields were modified

PERFORMANCE OPTIMIZATIONS:
- Only validates fields being updated
- Single database query for existence check
- Efficient slug uniqueness checking with exclusion
- Minimal database updates (only changed fields)

SECURITY FEATURES:
- Admin-only access through middleware
- Input validation prevents malicious data
- Constraint enforcement through business rules
- Audit trail through timestamps

EXTENSIBILITY:
- Easy to add new updatable fields
- Validation rules can be extended per field
- Support for additional business logic
- Compatible with workflow and approval systems
*/
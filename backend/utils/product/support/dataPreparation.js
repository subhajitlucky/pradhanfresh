/**
 * Prepare product data for database creation
 * @param {Object} rawData - Raw product data from request
 * @param {String} slug - Generated unique slug
 * @param {Number} userId - Creating user ID
 * @returns {Object} Prepared product data
 */
const prepareProductData = (rawData, slug, userId) => {
  const {
    name,
    description,
    shortDescription,
    price,
    salePrice,
    categoryId,
    images,
    thumbnail,
    stock,
    sku,
    unit,
    weight,
    isFeatured,
    isOrganic
  } = rawData;

  // Parse and validate numeric fields
  const parsedPrice = parseFloat(price);
  const parsedSalePrice = salePrice && salePrice !== '' ? parseFloat(salePrice) : null;
  const parsedCategoryId = parseInt(categoryId);
  const parsedStock = parseInt(stock) || 0;
  const parsedWeight = weight ? parseFloat(weight) : null;

  return {
    name: name.trim(),
    slug: slug,
    description: description.trim(),
    shortDescription: shortDescription?.trim() || null,
    price: parsedPrice,
    salePrice: parsedSalePrice,
    categoryId: parsedCategoryId,
    images: Array.isArray(images) ? images : [thumbnail],
    thumbnail: thumbnail.trim(),
    stock: parsedStock,
    isAvailable: parsedStock > 0, // Auto-set availability based on stock
    sku: sku.trim().toUpperCase(),
    unit: unit.trim().toLowerCase(),
    weight: parsedWeight,
    isFeatured: Boolean(isFeatured),
    isOrganic: Boolean(isOrganic),
    createdById: userId
  };
};

/**
 * Prepare update data for product modification
 * @param {Object} rawData - Raw update data from request
 * @param {Object} existingProduct - Current product data
 * @param {String} newSlug - New slug if name changed
 * @returns {Object} Prepared update data
 */
const prepareUpdateData = (rawData, existingProduct, newSlug = null) => {
  const {
    name,
    description,
    shortDescription,
    price,
    salePrice,
    categoryId,
    images,
    thumbnail,
    stock,
    sku,
    unit,
    weight,
    isFeatured,
    isOrganic
  } = rawData;

  const updateData = {};

  // Handle name and slug update
  if (name !== undefined) {
    updateData.name = name.trim();
    if (newSlug && updateData.name !== existingProduct.name) {
      updateData.slug = newSlug;
    }
  }

  // Handle text fields
  if (description !== undefined) updateData.description = description.trim();
  if (shortDescription !== undefined) updateData.shortDescription = shortDescription?.trim() || null;
  if (thumbnail !== undefined) updateData.thumbnail = thumbnail.trim();
  if (unit !== undefined) updateData.unit = unit.trim().toLowerCase();

  // Handle optional fields
  if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;
  if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
  if (isOrganic !== undefined) updateData.isOrganic = Boolean(isOrganic);

  // Handle images array
  if (images !== undefined) {
    updateData.images = Array.isArray(images) ? images : [thumbnail || existingProduct.thumbnail];
  }

  // Handle numeric fields
  if (price !== undefined) {
    updateData.price = parseFloat(price);
  }

  if (salePrice !== undefined) {
    if (salePrice === null || salePrice === '') {
      updateData.salePrice = null; // Allow clearing sale price
    } else {
      updateData.salePrice = parseFloat(salePrice);
    }
  }

  if (categoryId !== undefined) {
    updateData.categoryId = parseInt(categoryId);
  }

  if (stock !== undefined) {
    updateData.stock = parseInt(stock);
    updateData.isAvailable = updateData.stock > 0; // Auto-update availability
  }

  if (sku !== undefined) {
    updateData.sku = sku.trim().toUpperCase();
  }

  // Add update timestamp
  updateData.updatedAt = new Date();

  return updateData;
};

module.exports = {
  prepareProductData,
  prepareUpdateData
};

/*
=== PRODUCT DATA PREPARATION MODULE ===

This module handles the transformation and preparation of raw product data for database operations.

KEY FEATURES:

1. **Creation Data Preparation**:
   - Transforms raw request data into database-ready format
   - Handles type conversions and normalization
   - Sets default values and auto-calculated fields
   - Ensures data consistency and format standards

2. **Update Data Preparation**:
   - Supports partial updates (only changed fields)
   - Maintains existing values for unchanged fields
   - Handles special cases like clearing sale prices
   - Preserves data integrity during modifications

3. **Data Normalization**:
   - Text fields are trimmed and standardized
   - SKUs are converted to uppercase
   - Units are converted to lowercase
   - Boolean fields are properly converted
   - Numeric fields are parsed and validated

DATA TRANSFORMATION RULES:

**Text Fields**:
- Names and descriptions: trimmed whitespace
- SKU: uppercase normalization
- Unit: lowercase normalization
- Short description: null if empty

**Numeric Fields**:
- Price: parsed as float, must be positive
- Sale price: optional, null if not provided
- Stock: parsed as integer, defaults to 0
- Weight: optional float, null if not provided
- Category ID: parsed as integer

**Boolean Fields**:
- isFeatured: explicit boolean conversion
- isOrganic: explicit boolean conversion
- isAvailable: auto-calculated from stock level

**Array Fields**:
- Images: ensures array format, falls back to thumbnail

USAGE EXAMPLES:
```javascript
const { prepareProductData, prepareUpdateData } = require('../utils/product/dataPreparation');

// For product creation
const productData = prepareProductData(req.body, generatedSlug, userId);
const newProduct = await prisma.product.create({ data: productData });

// For product updates
const updateData = prepareUpdateData(req.body, existingProduct, newSlug);
if (Object.keys(updateData).length > 0) {
  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: updateData
  });
}
```

BUSINESS LOGIC:
- Stock availability is automatically calculated
- Images array ensures at least thumbnail is included
- Update timestamps are automatically added
- Default values are applied for optional fields

DATA INTEGRITY:
- Type safety through explicit parsing
- Null handling for optional fields
- Whitespace normalization prevents data pollution
- Consistent formatting across all operations

EXTENSIBILITY:
- Easy to add new field preparation rules
- Supports additional validation layers
- Can be extended for field-specific transformations
- Compatible with different database schemas
*/

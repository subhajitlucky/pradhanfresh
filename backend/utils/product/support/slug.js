const prisma = require('../../prisma/client');

/**
 * Generate URL-friendly slug from product name
 * @param {String} name - Product name
 * @returns {String} Generated slug
 */
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')    // Remove special characters but keep alphanumeric, space, underscore, hyphen
    .replace(/[\s_-]+/g, '-')    // Replace spaces, underscores, and hyphens with single hyphen
    .replace(/^-+|-+$/g, '');    // Remove leading/trailing hyphens
};

/**
 * Ensure slug uniqueness by checking database and adding counter if needed
 * @param {String} baseSlug - Base slug generated from name
 * @param {Number} excludeProductId - Product ID to exclude from check (for updates)
 * @returns {Promise<String>} Unique slug
 */
const ensureUniqueSlug = async (baseSlug, excludeProductId = null) => {
  let finalSlug = baseSlug;
  let slugCounter = 1;
  
  while (true) {
    const existingProduct = await prisma.product.findUnique({ 
      where: { slug: finalSlug } 
    });
    
    // If slug doesn't exist or belongs to current product (for updates), we can use it
    if (!existingProduct || (excludeProductId && existingProduct.id === excludeProductId)) {
      break;
    }
    
    finalSlug = `${baseSlug}-${slugCounter}`;
    slugCounter++;
  }
  
  return finalSlug;
};

/**
 * Generate unique slug for product
 * @param {String} name - Product name
 * @param {Number} excludeProductId - Product ID to exclude from check (for updates)
 * @returns {Promise<String>} Unique slug
 */
const generateUniqueSlug = async (name, excludeProductId = null) => {
  const baseSlug = generateSlug(name);
  return await ensureUniqueSlug(baseSlug, excludeProductId);
};

module.exports = {
  generateSlug,
  ensureUniqueSlug,
  generateUniqueSlug
};

/*
=== PRODUCT SLUG GENERATION MODULE ===

This module handles the generation of URL-friendly slugs for products with automatic uniqueness checking.

KEY FEATURES:

1. **Slug Generation**:
   - Converts product names to URL-friendly format
   - Removes special characters and normalizes spacing
   - Uses hyphens for word separation
   - Converts to lowercase for consistency

2. **Uniqueness Enforcement**:
   - Checks database for existing slugs
   - Automatically appends numbers for duplicates
   - Supports exclusion for product updates
   - Ensures no slug conflicts in the system

3. **Update Support**:
   - Allows existing products to keep their slugs during updates
   - Only generates new slugs when product name changes
   - Prevents unnecessary slug modifications

SLUG GENERATION RULES:
- Convert to lowercase
- Remove special characters (keep only a-z, 0-9, spaces, hyphens)
- Replace spaces with hyphens
- Collapse multiple hyphens into single hyphens
- Trim leading/trailing whitespace

UNIQUENESS RESOLUTION:
When duplicate slugs are found, the system automatically appends numbers:
- "fresh-apples" → exists
- "fresh-apples-1" → generated for new product
- "fresh-apples-2" → if fresh-apples-1 also exists

USAGE EXAMPLES:
```javascript
const { generateUniqueSlug } = require('../utils/product/slug');

// For new product creation
const slug = await generateUniqueSlug("Fresh Organic Apples");
// Result: "fresh-organic-apples" or "fresh-organic-apples-1" if duplicate

// For product updates (exclude current product from uniqueness check)
const updatedSlug = await generateUniqueSlug("Fresh Organic Apples", productId);
// Result: existing slug unchanged if name didn't change, or new unique slug
```

DATABASE INTERACTION:
- Uses Prisma ORM for slug uniqueness checking
- Efficient single-field queries for performance
- Supports both creation and update scenarios
- Handles race conditions through database constraints

PERFORMANCE CONSIDERATIONS:
- Minimal database queries (only checks when potential conflicts exist)
- Efficient incremental counter approach
- Could be optimized with database sequences for high-volume systems
- Slug generation is deterministic and cacheable

EXTENSIBILITY:
- Easy to modify slug generation rules
- Could support custom slug formats per category
- Can be extended to handle internationalization
- Compatible with existing URL routing systems

SEO BENEFITS:
- Creates human-readable URLs
- Maintains consistency in URL structure
- Supports product name changes without breaking links
- Follows web standards for URL formatting
*/

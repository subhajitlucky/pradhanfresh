const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');
const requireAdmin = require('../../middleware/requireAdmin');

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

    // === STEP 3: EXTRACT UPDATE DATA ===
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
    } = req.body;

    // === STEP 4: PREPARE UPDATE DATA (PARTIAL UPDATES ALLOWED) ===
    const updateData = {};

    // Handle name update (with slug regeneration if needed)
    if (name !== undefined) {
      updateData.name = name.trim();
      
      // Generate new slug if name changed
      if (updateData.name !== existingProduct.name) {
        const slug = updateData.name
          .toLowerCase()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        // Check if slug is unique (add number if not, but exclude current product)
        let finalSlug = slug;
        let slugCounter = 1;
        while (true) {
          const slugExists = await prisma.product.findUnique({ 
            where: { slug: finalSlug } 
          });
          
          // If slug doesn't exist or belongs to current product, we can use it
          if (!slugExists || slugExists.id === productId) {
            break;
          }
          
          finalSlug = `${slug}-${slugCounter}`;
          slugCounter++;
        }
        
        updateData.slug = finalSlug;
      }
    }

    // Handle other fields
    if (description !== undefined) updateData.description = description.trim();
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription?.trim() || null;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail.trim();
    if (images !== undefined) updateData.images = Array.isArray(images) ? images : [thumbnail || existingProduct.thumbnail];
    if (unit !== undefined) updateData.unit = unit.trim().toLowerCase();
    if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
    if (isOrganic !== undefined) updateData.isOrganic = Boolean(isOrganic);

    // === STEP 5: VALIDATE NUMERIC FIELDS ===
    
    // Validate price if provided
    if (price !== undefined) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a positive number',
          error: 'Validation Error'
        });
      }
      updateData.price = parsedPrice;
    }

    // Validate sale price if provided
    if (salePrice !== undefined) {
      if (salePrice === null || salePrice === '') {
        updateData.salePrice = null; // Allow clearing sale price
      } else {
        const parsedSalePrice = parseFloat(salePrice);
        if (isNaN(parsedSalePrice) || parsedSalePrice <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Sale price must be a positive number',
            error: 'Validation Error'
          });
        }
        
        // Check sale price vs regular price (use new price if provided, otherwise existing)
        const currentPrice = updateData.price || existingProduct.price;
        if (parsedSalePrice >= currentPrice) {
          return res.status(400).json({
            success: false,
            message: 'Sale price must be less than regular price',
            error: 'Validation Error'
          });
        }
        
        updateData.salePrice = parsedSalePrice;
      }
    }

    // Validate category if provided
    if (categoryId !== undefined) {
      const parsedCategoryId = parseInt(categoryId);
      if (isNaN(parsedCategoryId)) {
        return res.status(400).json({
          success: false,
          message: 'Category ID must be a number',
          error: 'Validation Error'
        });
      }

      const categoryExists = await prisma.category.findUnique({
        where: { id: parsedCategoryId }
      });

      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: `Category with ID ${parsedCategoryId} does not exist`,
          error: 'Validation Error'
        });
      }

      updateData.categoryId = parsedCategoryId;
    }

    // Validate stock if provided
    if (stock !== undefined) {
      const parsedStock = parseInt(stock);
      if (isNaN(parsedStock) || parsedStock < 0) {
        return res.status(400).json({
          success: false,
          message: 'Stock must be a non-negative number',
          error: 'Validation Error'
        });
      }
      updateData.stock = parsedStock;
      updateData.isAvailable = parsedStock > 0; // Auto-update availability
    }

    // === STEP 6: VALIDATE SKU UNIQUENESS (IF CHANGING) ===
    if (sku !== undefined) {
      const normalizedSKU = sku.trim().toUpperCase();
      
      // Only check uniqueness if SKU is actually changing
      if (normalizedSKU !== existingProduct.sku) {
        const existingSKU = await prisma.product.findUnique({
          where: { sku: normalizedSKU }
        });

        if (existingSKU) {
          return res.status(409).json({
            success: false,
            message: `Product with SKU '${sku}' already exists`,
            error: 'Conflict'
          });
        }
      }
      
      updateData.sku = normalizedSKU;
    }

    // === STEP 7: UPDATE PRODUCT IN DATABASE ===
    
    // Only proceed if there are actual changes
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update',
        error: 'Validation Error'
      });
    }

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

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
      changedFields: Object.keys(updateData)
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
const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');
const requireAdmin = require('../../middleware/requireAdmin');

// POST /api/products - Create new product (Admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
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

    // === VALIDATION LAYER 1: REQUIRED FIELDS ===
    const requiredFields = ['name', 'description', 'price', 'categoryId', 'thumbnail', 'sku', 'unit'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields: missingFields,
        error: 'Validation Error'
      });
    }

    // === VALIDATION LAYER 2: DATA TYPE VALIDATION ===
    
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number',
        error: 'Validation Error'
      });
    }

    let parsedSalePrice = null;
    if (salePrice !== undefined && salePrice !== null && salePrice !== '') {
      parsedSalePrice = parseFloat(salePrice);
      if (isNaN(parsedSalePrice) || parsedSalePrice <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Sale price must be a positive number',
          error: 'Validation Error'
        });
      }
      if (parsedSalePrice >= parsedPrice) {
        return res.status(400).json({
          success: false,
          message: 'Sale price must be less than regular price',
          error: 'Validation Error'
        });
      }
    }

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

    const parsedStock = parseInt(stock) || 0;
    if (parsedStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock cannot be negative',
        error: 'Validation Error'
      });
    }

    // === VALIDATION LAYER 3: BUSINESS LOGIC VALIDATION ===
    
    const existingSKU = await prisma.product.findUnique({
      where: { sku: sku.trim().toUpperCase() }
    });

    if (existingSKU) {
      return res.status(409).json({
        success: false,
        message: `Product with SKU '${sku}' already exists`,
        error: 'Conflict'
      });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    let finalSlug = slug;
    let slugCounter = 1;
    while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${slugCounter}`;
      slugCounter++;
    }

    // === DATA PREPARATION ===
    
    const productData = {
      name: name.trim(),
      slug: finalSlug,
      description: description.trim(),
      shortDescription: shortDescription?.trim() || null,
      price: parsedPrice,
      salePrice: parsedSalePrice,
      categoryId: parsedCategoryId,
      images: Array.isArray(images) ? images : [thumbnail],
      thumbnail: thumbnail.trim(),
      stock: parsedStock,
      isAvailable: parsedStock > 0,
      sku: sku.trim().toUpperCase(),
      unit: unit.trim().toLowerCase(),
      weight: weight ? parseFloat(weight) : null,
      isFeatured: Boolean(isFeatured),
      isOrganic: Boolean(isOrganic),
      createdById: req.user.userId
    };

    // === DATABASE CREATION ===
    
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
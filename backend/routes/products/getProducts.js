const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');

// GET /api/products - Get all products
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      count: products.length
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 
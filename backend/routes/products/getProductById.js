const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');

// GET /api/products/:id - Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const productId = parseInt(id);
    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID. ID must be a number.',
        error: 'Bad Request'
      });
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId
      },
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

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${productId} not found`,
        error: 'Not Found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: product
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 
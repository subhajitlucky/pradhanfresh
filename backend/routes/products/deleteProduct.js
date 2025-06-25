const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');
const requireAdmin = require('../../middleware/requireAdmin');

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
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
        category: {
          select: {
            name: true
          }
        },
        createdBy: {
          select: {
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

    // === STEP 3: STORE PRODUCT INFO FOR RESPONSE ===
    const productInfo = {
      id: existingProduct.id,
      name: existingProduct.name,
      sku: existingProduct.sku,
      category: existingProduct.category.name,
      createdBy: existingProduct.createdBy.name
    };

    // === STEP 4: DELETE PRODUCT FROM DATABASE ===
    await prisma.product.delete({
      where: { id: productId }
    });

    // === SUCCESS RESPONSE ===
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      deletedProduct: productInfo
    });

  } catch (error) {
    // Log error for debugging
    console.error('Error deleting product:', error);
    
    // Handle foreign key constraint violations
    if (error.code === 'P2003') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete product - it is referenced by other records (orders, reviews, etc.)',
        error: 'Constraint Violation'
      });
    }
    
    // Handle record not found during delete (race condition)
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Product not found or already deleted',
        error: 'Not Found'
      });
    }
    
    // Send generic error response
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 
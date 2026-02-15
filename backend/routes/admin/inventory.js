const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');
const requireAdmin = require('../../middleware/requireAdmin');

// GET /api/admin/inventory/low-stock - Get products with low inventory
router.get('/low-stock', requireAuth, requireAdmin, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: {
          lte: threshold
        },
        isAvailable: true
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        unit: true,
        thumbnail: true,
        categoryId: true,
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        stock: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      count: lowStockProducts.length,
      threshold,
      data: lowStockProducts
    });
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stock alerts' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            products: {
              where: { isAvailable: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const categoriesWithCounts = categories.map(category => ({
      ...category,
      productCount: category._count.products,
    }));

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categoriesWithCounts
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// GET /api/categories/:slug - Get single category by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await prisma.category.findUnique({
      where: { slug, isActive: true },
      include: {
        products: {
          where: { isAvailable: true },
          orderBy: { isFeatured: 'desc' }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch category' });
  }
});

module.exports = router;

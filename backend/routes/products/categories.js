const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    // Query database for all active categories with product counts
    const categories = await prisma.category.findMany({
      where: {
        isActive: true  // Only show active categories
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                isAvailable: true  // Only count available products
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'  // Sort categories alphabetically
      }
    });

    // Transform the response to include product count in a cleaner format
    const categoriesWithCounts = categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      isActive: category.isActive,
      productCount: category._count.products,  // Cleaner field name
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }));

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categoriesWithCounts,
      count: categoriesWithCounts.length
    });

  } catch (error) {
    // Log error for debugging
    console.error('Error fetching categories:', error);
    
    // Send error response
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/categories/:slug - Get single category by slug
router.get('/:slug', async (req, res) => {
  try {
    // Extract slug from URL parameter
    const { slug } = req.params;
    
    // Validate slug format (basic validation)
    if (!slug || slug.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category slug is required',
        error: 'Bad Request'
      });
    }

    // Query database for single category by slug with products
    const category = await prisma.category.findUnique({
      where: {
        slug: slug.toLowerCase()  // Ensure case-insensitive lookup
      },
      include: {
        products: {
          where: {
            isAvailable: true  // Only include available products
          },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            salePrice: true,
            thumbnail: true,
            stock: true,
            isFeatured: true,
            isOrganic: true,
            unit: true
            // Don't include full description to keep response lighter
          },
          orderBy: {
            isFeatured: 'desc'  // Show featured products first
          }
        },
        _count: {
          select: {
            products: {
              where: {
                isAvailable: true
              }
            }
          }
        }
      }
    });

    // Check if category exists and is active
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category '${slug}' not found`,
        error: 'Not Found'
      });
    }

    if (!category.isActive) {
      return res.status(404).json({
        success: false,
        message: `Category '${slug}' is not available`,
        error: 'Not Found'
      });
    }

    // Transform response for cleaner structure
    const categoryResponse = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      productCount: category._count.products,
      products: category.products,  // Array of products in this category
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    };

    // Send success response with category and its products
    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: categoryResponse
    });

  } catch (error) {
    // Log error for debugging
    console.error('Error fetching category:', error);
    
    // Send error response
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 
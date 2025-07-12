const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');

// GET /api/products - Get all products with pagination, search, and filtering
router.get('/', async (req, res) => {
  try {
    // Parse pagination parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; // Show 6 products per page
    const skip = (page - 1) * limit;

    // Parse search and filter parameters
    const search = req.query.search || '';
    const categoryIds = req.query.categories ? req.query.categories.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const sortBy = req.query.sortBy || 'createdAt'; // createdAt, name, price
    const sortOrder = req.query.sortOrder || 'desc'; // asc, desc
    const isOrganic = req.query.isOrganic === 'true' ? true : req.query.isOrganic === 'false' ? false : null;
    const isFeatured = req.query.isFeatured === 'true' ? true : req.query.isFeatured === 'false' ? false : null;
    const isAvailable = req.query.isAvailable === 'false' ? false : true; // Default to available products

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page number must be greater than 0'
      });
    }

    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 50'
      });
    }

    // Validate sort parameters
    const validSortFields = ['createdAt', 'name', 'price'];
    const validSortOrders = ['asc', 'desc'];
    
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sortBy field. Must be one of: createdAt, name, price'
      });
    }

    if (!validSortOrders.includes(sortOrder)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sortOrder. Must be asc or desc'
      });
    }

    // Build where clause for filtering
    const whereClause = {
      isAvailable: isAvailable,
    };

    // Add search functionality
    if (search.trim()) {
      whereClause.OR = [
        {
          name: {
            contains: search.trim(),
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search.trim(),
            mode: 'insensitive'
          }
        },
        {
          shortDescription: {
            contains: search.trim(),
            mode: 'insensitive'
          }
        },
        {
          category: {
            name: {
              contains: search.trim(),
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    // Add category filtering
    if (categoryIds.length > 0) {
      whereClause.categoryId = {
        in: categoryIds
      };
    }

    // Add price range filtering
    if (minPrice !== null || maxPrice !== null) {
      whereClause.price = {};
      if (minPrice !== null) {
        whereClause.price.gte = minPrice;
      }
      if (maxPrice !== null) {
        whereClause.price.lte = maxPrice;
      }
    }

    // Add organic filter
    if (isOrganic !== null) {
      whereClause.isOrganic = isOrganic;
    }

    // Add featured filter
    if (isFeatured !== null) {
      whereClause.isFeatured = isFeatured;
    }

    // Build orderBy clause
    let orderBy = {};
    if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'price') {
      orderBy.price = sortOrder;
    }

    // Get total count for pagination metadata (with filters applied)
    const totalProducts = await prisma.product.count({
      where: whereClause
    });

    // Fetch filtered and paginated products
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: orderBy,
      skip: skip,
      take: limit
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalProducts / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get filter metadata for frontend
    const filterMetadata = {
      totalResults: totalProducts,
      appliedFilters: {
        search: search || null,
        categories: categoryIds.length > 0 ? categoryIds : null,
        priceRange: (minPrice !== null || maxPrice !== null) ? { min: minPrice, max: maxPrice } : null,
        isOrganic: isOrganic,
        isFeatured: isFeatured,
        sortBy: sortBy,
        sortOrder: sortOrder
      }
    };

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalProducts: totalProducts,
        productsPerPage: limit,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      },
      filters: filterMetadata
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
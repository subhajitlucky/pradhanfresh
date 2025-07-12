const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');
const { getOrderStatusInfo } = require('../../utils/orderUtils');

// GET /api/orders - Get user's orders with filtering and pagination
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      startDate,
      endDate
    } = req.query;

    // === INPUT VALIDATION ===
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page number',
        error: 'Validation Error'
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 50',
        error: 'Validation Error'
      });
    }

    // Validate sort fields
    const validSortFields = ['createdAt', 'updatedAt', 'totalAmount', 'status'];
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sort field',
        error: 'Validation Error'
      });
    }

    const validSortOrders = ['asc', 'desc'];
    if (!validSortOrders.includes(sortOrder)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sort order',
        error: 'Validation Error'
      });
    }

    // === BUILD QUERY FILTERS ===
    const whereClause = {
      userId: userId
    };

    // Status filter
    if (status) {
      const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status filter',
          error: 'Validation Error'
        });
      }
      whereClause.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.createdAt = {};
      
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid start date format',
            error: 'Validation Error'
          });
        }
        whereClause.createdAt.gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid end date format',
            error: 'Validation Error'
          });
        }
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    // === CALCULATE PAGINATION ===
    const skip = (pageNum - 1) * limitNum;

    // === GET ORDERS WITH PAGINATION ===
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  thumbnail: true,
                  unit: true
                }
              }
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip: skip,
        take: limitNum
      }),
      prisma.order.count({
        where: whereClause
      })
    ]);

    // === ENHANCE ORDERS WITH STATUS INFO ===
    const enhancedOrders = orders.map(order => ({
      ...order,
      statusInfo: getOrderStatusInfo(order.status),
      itemsCount: order.items.length,
      deliveryAddress: order.deliveryAddress, // Include full address
      canCancel: ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status),
      canReturn: order.status === 'DELIVERED' && 
                 new Date() - new Date(order.deliveredAt) <= 7 * 24 * 60 * 60 * 1000 // 7 days
    }));

    // === CALCULATE PAGINATION INFO ===
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // === GET ORDER SUMMARY STATS ===
    const orderStats = await prisma.order.groupBy({
      by: ['status'],
      where: { userId: userId },
      _count: {
        id: true
      },
      _sum: {
        totalAmount: true
      }
    });

    const stats = {
      totalOrders: totalCount,
      totalSpent: orderStats.reduce((sum, stat) => sum + (stat._sum.totalAmount || 0), 0),
      statusBreakdown: orderStats.reduce((acc, stat) => {
        acc[stat.status] = {
          count: stat._count.id,
          totalAmount: stat._sum.totalAmount || 0
        };
        return acc;
      }, {})
    };

    res.status(200).json({
      success: true,
      message: `Found ${orders.length} orders`,
      data: {
        orders: enhancedOrders,
        pagination: {
          currentPage: pageNum,
          totalPages: totalPages,
          totalCount: totalCount,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
          limit: limitNum
        },
        filters: {
          status: status || 'all',
          sortBy: sortBy,
          sortOrder: sortOrder,
          startDate: startDate || null,
          endDate: endDate || null
        },
        stats: stats
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 
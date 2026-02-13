const express = require('express');
const router = express.Router();
const prisma = require('../../../prisma/client');

// GET /api/admin/dashboard/stats - Get key stats for the dashboard
router.get('/stats', async (req, res) => {
  try {
    // 1. Get Total Revenue (from completed orders)
    const totalRevenueResult = await prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        status: 'DELIVERED',
      },
    });
    const totalRevenue = totalRevenueResult._sum.totalAmount || 0;

    // 2. Get Total Orders
    const totalOrders = await prisma.order.count();

    // 3. Get Total Customers
    const totalCustomers = await prisma.user.count({
      where: {
        role: 'USER',
      },
    });

    // 4. Get 10 Recent Orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });
    
    // 5. Get Sales data for the last 7 days
    const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));
    const salesData = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
        status: 'DELIVERED',
      },
      _sum: {
        totalAmount: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Format sales data for charts
    const formattedSalesData = salesData.map(item => ({
      date: item.createdAt.toISOString().split('T')[0],
      sales: item._sum.totalAmount,
    }));

    // 6. Top Produce (Best selling products)
    const topProduce = await prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      _sum: {
        quantity: true,
        subtotal: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    });

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        recentOrders,
        salesData: formattedSalesData,
        topProduce
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router; 
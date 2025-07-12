const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');
const { getOrderStatusInfo } = require('../../utils/orderUtils');

// GET /api/orders/:orderNumber - Get single order details
router.get('/:orderNumber', requireAuth, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const userId = req.user.userId;

    // === INPUT VALIDATION ===
    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order number is required',
        error: 'Validation Error'
      });
    }

    // === GET ORDER DETAILS ===
    const order = await prisma.order.findUnique({
      where: { orderNumber: orderNumber },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                thumbnail: true,
                unit: true,
                price: true,
                salePrice: true,
                isAvailable: true,
                stock: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        error: 'Not Found'
      });
    }

    // === VERIFY OWNERSHIP ===
    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: This order does not belong to you',
        error: 'Forbidden'
      });
    }

    // === ENHANCE ORDER WITH ADDITIONAL INFO ===
    const statusInfo = getOrderStatusInfo(order.status);
    
    // Calculate order timeline
    const timeline = [];
    
    if (order.createdAt) {
      timeline.push({
        status: 'PENDING',
        timestamp: order.createdAt,
        title: 'Order Placed',
        description: 'Your order has been placed successfully'
      });
    }

    if (order.confirmedAt) {
      timeline.push({
        status: 'CONFIRMED',
        timestamp: order.confirmedAt,
        title: 'Order Confirmed',
        description: 'Your order has been confirmed and is being prepared'
      });
    }

    if (order.shippedAt) {
      timeline.push({
        status: 'SHIPPED',
        timestamp: order.shippedAt,
        title: 'Order Shipped',
        description: 'Your order is on the way'
      });
    }

    if (order.deliveredAt) {
      timeline.push({
        status: 'DELIVERED',
        timestamp: order.deliveredAt,
        title: 'Order Delivered',
        description: 'Your order has been delivered successfully'
      });
    }

    if (order.cancelledAt) {
      timeline.push({
        status: 'CANCELLED',
        timestamp: order.cancelledAt,
        title: 'Order Cancelled',
        description: 'Your order has been cancelled'
      });
    }

    // Sort timeline by timestamp
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Check if order can be cancelled
    const canCancel = ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status);
    
    // Check if order can be returned (within 7 days of delivery)
    const canReturn = order.status === 'DELIVERED' && 
                      order.deliveredAt &&
                      new Date() - new Date(order.deliveredAt) <= 7 * 24 * 60 * 60 * 1000;

    // Calculate delivery estimation
    let deliveryEstimation = null;
    if (order.deliveryDate) {
      deliveryEstimation = {
        date: order.deliveryDate,
        slot: order.deliverySlot,
        isEstimated: !order.deliveredAt
      };
    } else if (!order.deliveredAt && order.status !== 'CANCELLED') {
      // Estimate delivery date (3-5 days from order date)
      const estimatedDate = new Date(order.createdAt);
      estimatedDate.setDate(estimatedDate.getDate() + 4);
      deliveryEstimation = {
        date: estimatedDate,
        slot: 'To be confirmed',
        isEstimated: true
      };
    }

    // Enhanced order object
    const enhancedOrder = {
      ...order,
      statusInfo,
      timeline,
      canCancel,
      canReturn,
      deliveryEstimation,
      itemsCount: order.items.length,
      totalSavings: order.items.reduce((savings, item) => {
        const currentPrice = item.product.salePrice || item.product.price;
        const originalPrice = item.product.price;
        if (currentPrice < originalPrice) {
          return savings + ((originalPrice - currentPrice) * item.quantity);
        }
        return savings;
      }, 0),
      // Payment information
      paymentInfo: {
        method: order.paymentMethod,
        status: order.paymentStatus,
        paymentId: order.paymentId,
        isPaid: order.paymentStatus === 'COMPLETED',
        isCOD: order.paymentMethod === 'COD'
      }
    };

    res.status(200).json({
      success: true,
      message: 'Order details retrieved successfully',
      data: {
        order: enhancedOrder
      }
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 
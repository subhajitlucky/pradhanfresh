const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');
const { getOrderStatusInfo } = require('../../utils/orderUtils');

// PUT /api/orders/:orderNumber/cancel - Cancel order (User can cancel their own order)
router.put('/:orderNumber/cancel', requireAuth, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    // === INPUT VALIDATION ===
    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order number is required',
        error: 'Validation Error'
      });
    }

    // === GET ORDER ===
    const order = await prisma.order.findUnique({
      where: { orderNumber: orderNumber },
      include: {
        items: {
          select: {
            productId: true,
            quantity: true,
            productName: true
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

    // === VALIDATE CANCELLATION ===
    const cancellableStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING'];
    if (!cancellableStatuses.includes(order.status)) {
      const statusInfo = getOrderStatusInfo(order.status);
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${statusInfo.label}`,
        error: 'Invalid Status',
        details: {
          currentStatus: order.status,
          statusInfo: statusInfo,
          canCancel: false
        }
      });
    }

    // === CANCEL ORDER WITH TRANSACTION ===
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // Update order status to cancelled
      const updated = await tx.order.update({
        where: { orderNumber: orderNumber },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          orderNotes: reason ? `Cancelled by user: ${reason}` : 'Cancelled by user',
          updatedAt: new Date()
        },
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

      // Restore product stock
      console.log(`🔄 Restoring stock for cancelled order: ${orderNumber}`);
      
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
        console.log(`   ✅ Restored ${item.quantity} units of ${item.productName}`);
      }

      return updated;
    });

    // === ENHANCED RESPONSE ===
    const statusInfo = getOrderStatusInfo('CANCELLED');
    const enhancedOrder = {
      ...cancelledOrder,
      statusInfo,
      itemsCount: cancelledOrder.items.length
    };

    console.log(`✅ Order cancelled: ${orderNumber} by user ${order.user.email}`);
    if (reason) {
      console.log(`   Reason: ${reason}`);
    }

    res.status(200).json({
      success: true,
      message: `Order ${orderNumber} has been cancelled successfully`,
      data: {
        order: enhancedOrder,
        cancellationInfo: {
          cancelledAt: cancelledOrder.cancelledAt,
          reason: reason || 'No reason provided',
          refundInfo: order.paymentStatus === 'COMPLETED' ? 
            'Refund will be processed within 5-7 business days' : 
            'No payment was processed for this order'
        },
        stockRestored: order.items.map(item => ({
          productName: item.productName,
          quantity: item.quantity
        }))
      }
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 
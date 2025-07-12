const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');
const { validateStatusTransition, getOrderStatusInfo } = require('../../utils/orderUtils');

// PUT /api/orders/:orderNumber/status - Update order status (Admin only)
router.put('/:orderNumber/status', requireAuth, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { status, adminNotes } = req.body;
    const userId = req.user.userId;

    // === ADMIN AUTHORIZATION ===
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true, email: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin privileges required',
        error: 'Forbidden'
      });
    }

    // === INPUT VALIDATION ===
    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order number is required',
        error: 'Validation Error'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
        error: 'Validation Error'
      });
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
        error: 'Validation Error'
      });
    }

    // === GET CURRENT ORDER ===
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

    // === VALIDATE STATUS TRANSITION ===
    const transitionValidation = validateStatusTransition(order.status, status);
    if (!transitionValidation.valid) {
      return res.status(400).json({
        success: false,
        message: transitionValidation.message,
        error: 'Invalid Transition'
      });
    }

    // === PREPARE UPDATE DATA ===
    const updateData = {
      status: status,
      updatedAt: new Date()
    };

    // Add admin notes if provided
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    // Set timestamp fields based on status
    const now = new Date();
    switch (status) {
      case 'CONFIRMED':
        updateData.confirmedAt = now;
        break;
      case 'SHIPPED':
        updateData.shippedAt = now;
        break;
      case 'DELIVERED':
        updateData.deliveredAt = now;
        // Auto-complete payment for COD orders
        if (order.paymentMethod === 'COD' && order.paymentStatus === 'PENDING') {
          updateData.paymentStatus = 'COMPLETED';
        }
        break;
      case 'CANCELLED':
        updateData.cancelledAt = now;
        break;
    }

    // === UPDATE ORDER WITH TRANSACTION ===
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const updated = await tx.order.update({
        where: { orderNumber: orderNumber },
        data: updateData,
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

      // Handle stock restoration for cancelled orders
      if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
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
      }

      return updated;
    });

    // === ENHANCED RESPONSE ===
    const statusInfo = getOrderStatusInfo(status);
    const enhancedOrder = {
      ...updatedOrder,
      statusInfo,
      itemsCount: updatedOrder.items.length
    };

    console.log(`✅ Order status updated: ${orderNumber} → ${status} by admin ${user.email}`);
    if (adminNotes) {
      console.log(`   Admin notes: ${adminNotes}`);
    }

    res.status(200).json({
      success: true,
      message: `Order ${orderNumber} status updated to ${statusInfo.label}`,
      data: {
        order: enhancedOrder,
        previousStatus: order.status,
        newStatus: status,
        updatedBy: {
          name: user.name,
          email: user.email
        },
        updatedAt: updateData.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 
const prisma = require('../../../prisma/client');
const { updateProductStock } = require('../../orderUtils');

/**
 * Cancel order with proper validation and stock restoration
 */
const cancelOrder = async (orderNumber, userId, reason) => {
  return await prisma.$transaction(async (prisma) => {
    // Get order and verify ownership
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        userId
      },
      include: {
        items: true
      }
    });

    if (!order) {
      throw new Error('Order not found or access denied');
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new Error(`Order cannot be cancelled. Current status: ${order.status}`);
    }

    // Update order status
    const cancelledOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason || 'Cancelled by customer',
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
        }
      }
    });

    // Restore product stock
    await updateProductStock(order.items, 'RESTORE');

    // Create status history entry
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        oldStatus: order.status,
        newStatus: 'CANCELLED',
        changedBy: userId,
        notes: reason || 'Order cancelled by customer',
        changedAt: new Date()
      }
    });

    return cancelledOrder;
  });
};

module.exports = {
  cancelOrder
};

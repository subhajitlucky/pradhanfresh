const prisma = require('../../../prisma/client');
const { updateProductStock } = require('../../orderUtils');

/**
 * Update order status with validation and side effects
 */
const updateOrderStatus = async (orderNumber, newStatus, adminNotes, adminId) => {
  return await prisma.$transaction(async (prisma) => {
    // Get current order
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { orderNumber },
      data: {
        status: newStatus,
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

    // Create status history entry
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        oldStatus: order.status,
        newStatus: newStatus,
        changedBy: adminId,
        notes: adminNotes || `Status changed to ${newStatus}`,
        changedAt: new Date()
      }
    });

    // Handle side effects based on new status
    if (newStatus === 'CANCELLED' && ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status)) {
      // Restore stock for cancelled orders
      await updateProductStock(order.items, 'RESTORE');
    }

    return updatedOrder;
  });
};

module.exports = {
  updateOrderStatus
};

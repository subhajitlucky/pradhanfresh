const prisma = require('../../../prisma/client');

/**
 * Get complete order with all related data
 */
const getCompleteOrder = async (orderNumber, userId = null) => {
  const whereClause = { orderNumber };
  
  // Add user filter if not admin access
  if (userId !== null) {
    whereClause.userId = userId;
  }

  const order = await prisma.order.findFirst({
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
              unit: true,
              price: true,
              salePrice: true
            }
          }
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      statusHistory: {
        include: {
          changedByUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          changedAt: 'desc'
        }
      }
    }
  });

  return order;
};

module.exports = {
  getCompleteOrder
};

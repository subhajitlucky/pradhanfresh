const prisma = require('../../../prisma/client');

/**
 * Get users with search and pagination for admin
 */
const getUsers = async (params) => {
  const { page, limit, skip, search } = params;

  // Build search clause
  const whereClause = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ],
  } : {};

  // Get users with order count
  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isEmailVerified: true,
      createdAt: true,
      _count: {
        select: { orders: true }
      }
    },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  // Get total count for pagination
  const totalUsers = await prisma.user.count({ where: whereClause });

  return {
    users,
    pagination: {
      total: totalUsers,
      page,
      pages: Math.ceil(totalUsers / limit),
      hasNextPage: page < Math.ceil(totalUsers / limit),
      hasPrevPage: page > 1
    }
  };
};

/**
 * Get user details for admin
 */
const getUserDetails = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isEmailVerified: true,
      createdAt: true,
      orders: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10 // Latest 10 orders
      },
      addresses: {
        orderBy: { isDefault: 'desc' }
      }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Update user role
 */
const updateUserRole = async (userId, newRole, adminId) => {
  // Get current user to check permissions
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Prevent admin from demoting themselves
  if (user.id === adminId && user.role === 'ADMIN' && newRole === 'USER') {
    throw new Error('Admins cannot demote themselves');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      updatedAt: true
    }
  });

  return updatedUser;
};

module.exports = {
  getUsers,
  getUserDetails,
  updateUserRole
};

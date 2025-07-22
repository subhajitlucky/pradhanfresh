const express = require('express');
const router = express.Router();
const prisma = require('../../../prisma/client');

// GET /api/admin/users - Get all users with search and pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const whereClause = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

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

    const totalUsers = await prisma.user.count({ where: whereClause });

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total: totalUsers,
        page,
        pages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id - Get a single user's details
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true
          }
        },
        addresses: {
          orderBy: { isDefault: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user details' });
  }
});

// PUT /api/admin/users/:id - Update a user's role
router.put('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const { role } = req.body;
    if (!role || !['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Prevent admin from demoting themselves
    if (user.id === req.user.userId && user.role === 'ADMIN' && role === 'USER') {
      return res.status(403).json({ success: false, message: 'Admins cannot demote themselves.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, message: 'Failed to update user role' });
  }
});

module.exports = router; 
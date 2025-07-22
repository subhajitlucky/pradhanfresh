const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const bcrypt = require('bcrypt');

// GET /api/user/profile - Get user's profile
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'Not Found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: 'Internal Server Error'
    });
  }
});

// PUT /api/user/profile - Update user's name
router.put('/', async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.userId;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
        error: 'Validation Error'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: 'Internal Server Error'
    });
  }
});

// POST /api/user/profile/change-password - Change user's password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
        error: 'Validation Error'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
        error: 'Validation Error'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'Not Found'
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect current password',
        error: 'Unauthorized'
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: 'Internal Server Error'
    });
  }
});

module.exports = router; 
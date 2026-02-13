const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, changeUserPassword } = require('../../utils/user/operations/profileOperations');

// GET /api/auth/profile - Get current user profile
router.get('/', async (req, res) => {
  try {
    const user = await getUserProfile(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve profile'
    });
  }
});

// PATCH /api/auth/profile - Update profile name
router.patch('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long'
      });
    }

    const updatedUser = await updateUserProfile(req.user.id, name);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
});

// POST /api/auth/profile/change-password - Change password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    await changeUserPassword(req.user.id, currentPassword, newPassword);
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    const statusCode = error.message === 'Incorrect current password' ? 401 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to change password'
    });
  }
});

module.exports = router;

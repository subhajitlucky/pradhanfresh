/**
 * Admin user management handlers
 * Contains the business logic for admin user operations
 */

const { validatePaginationParams, validateUserId, validateUserRole } = require('./validation');
const { getUsers, getUserDetails, updateUserRole } = require('./operations');

/**
 * Handle getting all users with pagination and search
 */
const handleGetUsers = async (req, res) => {
  try {
    const paginationValidation = validatePaginationParams(req.query);
    if (!paginationValidation.valid) {
      return res.status(400).json(paginationValidation);
    }

    const { page, limit, skip } = paginationValidation.data;
    const search = req.query.search || '';

    const result = await getUsers({ page, limit, skip, search });

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: result.users,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Error fetching users for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: 'Internal Server Error'
    });
  }
};

/**
 * Handle getting single user details
 */
const handleGetUserDetails = async (req, res) => {
  try {
    const userIdValidation = validateUserId(req.params.id);
    if (!userIdValidation.valid) {
      return res.status(400).json(userIdValidation);
    }

    const { userId } = userIdValidation.data;

    const user = await getUserDetails(userId);

    res.status(200).json({
      success: true,
      message: 'User details retrieved successfully',
      data: user
    });

  } catch (error) {
    console.error('Error fetching user details:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'Not Found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: 'Internal Server Error'
    });
  }
};

/**
 * Handle updating user role
 */
const handleUpdateUserRole = async (req, res) => {
  try {
    const userIdValidation = validateUserId(req.params.id);
    if (!userIdValidation.valid) {
      return res.status(400).json(userIdValidation);
    }

    const { userId: targetUserId } = userIdValidation.data;

    const roleValidation = validateUserRole(req.body);
    if (!roleValidation.valid) {
      return res.status(400).json(roleValidation);
    }

    const { role } = roleValidation.data;
    const currentAdminId = req.user.userId;

    const updatedUser = await updateUserRole(targetUserId, role, currentAdminId);

    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully`,
      data: updatedUser
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'Not Found'
      });
    }

    if (error.message === 'Admins cannot demote themselves') {
      return res.status(403).json({
        success: false,
        message: 'Admins cannot demote themselves',
        error: 'Forbidden'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: 'Internal Server Error'
    });
  }
};

module.exports = {
  handleGetUsers,
  handleGetUserDetails,
  handleUpdateUserRole
};

const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const { validateProfileUpdate, validatePasswordChange } = require('../../utils/user/validation');
const { getUserProfile, updateUserProfile, changeUserPassword } = require('../../utils/user/operations');

// Apply authentication middleware to all routes
router.use(requireAuth);

// GET /api/user/profile - Get user's profile
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await getUserProfile(userId);

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'Not Found'
      });
    }

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
    const userId = req.user.userId;

    // === VALIDATE INPUT ===
    const validation = validateProfileUpdate(req.body);
    if (!validation.valid) {
      return res.status(400).json(validation);
    }

    // === UPDATE PROFILE ===
    const updatedUser = await updateUserProfile(userId, validation.data.name);

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
    const userId = req.user.userId;

    // === VALIDATE INPUT ===
    const validation = validatePasswordChange(req.body);
    if (!validation.valid) {
      return res.status(400).json(validation);
    }

    // === CHANGE PASSWORD ===
    await changeUserPassword(userId, req.body.currentPassword, req.body.newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'Not Found'
      });
    }

    if (error.message === 'Incorrect current password') {
      return res.status(401).json({
        success: false,
        message: 'Incorrect current password',
        error: 'Unauthorized'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: 'Internal Server Error'
    });
  }
});

module.exports = router;

/*
=== USER PROFILE ROUTE HANDLER ===

This route handler manages user profile operations including viewing, updating, and password changes.

ROUTE INFORMATION:
- Base Path: /api/user/profile
- Authentication: Required for all routes
- Purpose: User profile management

AVAILABLE ROUTES:

1. **GET /** - Get User Profile
   - Returns user profile information
   - Excludes sensitive data (password)
   - Includes role and verification status

2. **PUT /** - Update User Name
   - Updates user's display name
   - Validates name format and length
   - Automatically trims whitespace

3. **POST /change-password** - Change Password
   - Requires current password verification
   - Validates new password strength
   - Uses secure password hashing

REQUEST/RESPONSE EXAMPLES:

**GET /api/user/profile**
```javascript
// Response
{
  success: true,
  message: "Profile retrieved successfully",
  data: {
    id: 123,
    name: "John Doe",
    email: "john@example.com",
    role: "USER",
    isEmailVerified: true,
    createdAt: "2024-01-01T00:00:00Z"
  }
}
```

**PUT /api/user/profile**
```javascript
// Request
{
  name: "John Smith"
}

// Response
{
  success: true,
  message: "Profile updated successfully",
  data: {
    // Updated user profile
  }
}
```

**POST /api/user/profile/change-password**
```javascript
// Request
{
  currentPassword: "oldpassword123",
  newPassword: "newpassword456"
}

// Response
{
  success: true,
  message: "Password changed successfully"
}
```

ERROR RESPONSES:
- 400: Validation errors (invalid name, weak password, etc.)
- 401: Incorrect current password
- 404: User not found
- 500: Server errors

VALIDATION FEATURES:
- **Name Validation**: Length checks, type validation, whitespace trimming
- **Password Validation**: Current password verification, strength requirements
- **Input Sanitization**: Prevents malicious input and ensures data quality

SECURITY FEATURES:
- Authentication required for all operations
- Current password verification before changes
- Secure password hashing with bcrypt
- No sensitive data exposure in responses

MODULAR DESIGN BENEFITS:
- **Validation Module**: Reusable input validation logic
- **Operations Module**: Clean database operations
- **Error Handling**: Consistent error responses
- **Code Organization**: Clear separation of concerns

BUSINESS RULES ENFORCED:
- Name must be 2-50 characters
- Password must be at least 6 characters
- New password must differ from current
- All text fields are trimmed automatically

USER EXPERIENCE:
- Clear success and error messages
- Comprehensive validation feedback
- Secure password change workflow
- Consistent response format

PERFORMANCE FEATURES:
- Selective field querying (excludes password)
- Efficient database operations
- Minimal data transfer
- Optimized for user-facing operations

EXTENSIBILITY:
- Easy to add new profile fields
- Validation rules can be enhanced
- Additional security measures can be integrated
- Compatible with email verification systems
*/
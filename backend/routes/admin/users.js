/**
 * Admin Users Routes
 * Handles admin operations for user management
 * 
 * Endpoints:
 * - GET /api/admin/users - List all users with pagination/search
 * - GET /api/admin/users/:id - Get specific user details  
 * - PUT /api/admin/users/:id - Update user role
 */

const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const requireAdmin = require('../../middleware/requireAdmin');
const { handleGetUsers, handleGetUserDetails, handleUpdateUserRole } = require('../../utils/admin/operations/userHandlers');

// Apply middleware to all routes
router.use(requireAuth, requireAdmin);

// GET /api/admin/users - Get all users with search and pagination
router.get('/', handleGetUsers);

// GET /api/admin/users/:id - Get single user details
router.get('/:id', handleGetUserDetails);

// PUT /api/admin/users/:id - Update a user's role
router.put('/:id', handleUpdateUserRole);

module.exports = router;
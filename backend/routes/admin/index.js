const express = require('express');
const router = express.Router();

// Import individual admin route handlers
const adminRoutes = require('./admin');

// Import middleware
const requireAuth = require('../../middleware/requireAuth');
const requireAdmin = require('../../middleware/requireAdmin');

// All admin routes require authentication and admin role
router.use('/', requireAuth, requireAdmin, adminRoutes);

module.exports = router; 
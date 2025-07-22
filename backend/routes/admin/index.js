const express = require('express');
const router = express.Router();

// Import individual admin route handlers
const adminRoutes = require('./admin');
const categoryRoutes = require('./categories');
const userRoutes = require('./users');
const dashboardRoutes = require('./dashboard');

// Import middleware
const requireAuth = require('../../middleware/requireAuth');
const requireAdmin = require('../../middleware/requireAdmin');

// All admin routes require authentication and admin role
router.use(requireAuth, requireAdmin);

// Mount admin-specific routes
router.use('/', adminRoutes);
router.use('/categories', categoryRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router; 
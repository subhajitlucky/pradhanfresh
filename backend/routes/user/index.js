const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');

// Import individual user route handlers
const profileRoutes = require('./profile');
const addressRoutes = require('./address');

// All routes in this module are protected and require authentication
router.use(requireAuth);

// Mount user-specific routes
router.use('/profile', profileRoutes);
router.use('/address', addressRoutes);

module.exports = router; 
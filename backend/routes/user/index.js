const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');

// Import individual user route handlers
const profileRoutes = require('./profile');
const addressRoutes = require('./addresses');
const wishlistRoutes = require('./wishlist');

// All routes in this module are protected and require authentication
router.use(requireAuth);

// Mount user-specific routes
router.use('/profile', profileRoutes);
router.use('/address', addressRoutes);
router.use('/wishlist', wishlistRoutes);

module.exports = router; 
const express = require('express');
const router = express.Router();

// Import individual auth route handlers
const authRoutes = require('./auth');
const signupRoute = require('./signup');
const loginRoute = require('./login');
const logoutRoute = require('./logout');
const profileRoute = require('./profile');
const refreshTokenRoute = require('./refreshToken');

// Import middleware
const requireAuth = require('../../middleware/requireAuth');

// Mount auth routes
router.use('/', authRoutes);           // /api/auth/*
router.use('/signup', signupRoute);    // /api/auth/signup
router.use('/login', loginRoute);      // /api/auth/login
router.use('/logout', logoutRoute);    // /api/auth/logout
router.use('/profile', requireAuth, profileRoute);  // /api/auth/profile (protected)
router.use('/refresh-token', refreshTokenRoute);    // /api/auth/refresh-token

module.exports = router; 
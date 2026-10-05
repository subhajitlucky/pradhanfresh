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
const { authLimiter, refreshLimiter } = require('../../middleware/rateLimiter');

/**
 * Limiters are attached per route, never with a blanket mount that also
 * matched the specific mounts below — that double-counted every request
 * against a 10-request budget.
 *
 * forgot/reset carry the strict limiter inside auth.js, next to the handlers
 * they actually protect.
 */
// Sub-routers are mounted with `router.use`, not `router.post` — passing a
// Router to a method helper registers nothing and every request 404s.
router.use('/signup', authLimiter, signupRoute);
router.use('/login', authLimiter, loginRoute);
router.use('/logout', logoutRoute);

router.use('/profile', requireAuth, profileRoute);

// Called automatically by the SPA whenever an access token expires, so it gets
// the looser budget.
router.use('/refresh-token', refreshLimiter, refreshTokenRoute);

// verify-email / forgot-password / reset-password
router.use('/', refreshLimiter, authRoutes);

module.exports = router;
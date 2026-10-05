const rateLimit = require('express-rate-limit');

// Automated tests fire dozens of requests in seconds — the brute-force
// budgets below would 429 the suite, so limiters are bypassed when
// NODE_ENV=test (production behavior is unchanged).
const skipInTest = () => process.env.NODE_ENV === 'test';

const json429 = (message) => ({
  success: false,
  message,
  error: 'Rate Limit Exceeded',
});

/**
 * General API limiter, applied to every request in server.js.
 */
const generalLimiter = rateLimit({
  skip: skipInTest,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: json429('Too many requests from this IP, please try again after 15 minutes'),
});

/**
 * Credential endpoints — login, signup, password reset.
 * These are the brute-force surface, so the budget stays tight.
 */
const authLimiter = rateLimit({
  skip: skipInTest,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: json429('Too many authentication attempts from this IP, please try again after 15 minutes'),
});

/**
 * Token refresh and email verification.
 *
 * These were previously covered by `authLimiter`, which was wrong on two
 * counts: a single request matched both `router.use('/', authLimiter, …)` and
 * `router.use('/login', authLimiter, …)` and so counted TWICE, and the SPA
 * calls /refresh-token automatically whenever an access token expires. Ten
 * ordinary requests locked a user out of the app for fifteen minutes.
 */
const refreshLimiter = rateLimit({
  skip: skipInTest,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: json429('Too many token refresh attempts. Please sign in again shortly.'),
});

module.exports = {
  generalLimiter,
  authLimiter,
  refreshLimiter,
};
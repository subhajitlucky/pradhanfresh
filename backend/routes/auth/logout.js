const express = require('express');
const { clearRefreshCookie } = require('../../utils/auth/cookies');
const router = express.Router();

router.post('/', (req, res) => {
  // Must use the same attributes the cookie was set with, or the browser keeps it.
  clearRefreshCookie(res);
  res.status(200).json({ message: 'Logged out successfully 🚪' });
});

module.exports = router;

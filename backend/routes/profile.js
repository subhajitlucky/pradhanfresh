const express = require('express');
const router = express.Router();

// ✅ This route is now protected in server.js
router.get('/', (req, res) => {
  res.json({
    message: 'You are authenticated ✅',
    user: req.user
  });
});

module.exports = router;

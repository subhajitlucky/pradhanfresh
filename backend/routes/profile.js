const express = require('express');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// ✅ This route is protected
router.get('/', requireAuth, (req, res) => {
  res.json({
    message: 'You are authenticated ✅',
    user: req.user
  });
});

module.exports = router;

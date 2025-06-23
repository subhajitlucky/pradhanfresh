const express = require('express');
const router = express.Router();

// This route is protected and can only be accessed by authenticated admins
router.get('/dashboard', (req, res) => {
  res.json({
    message: 'Welcome to the Admin Dashboard!',
    adminUser: req.user
  });
});

module.exports = router; 
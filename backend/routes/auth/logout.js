const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
  });
  res.status(200).json({ message: 'Logged out successfully 🚪' });
});

module.exports = router;

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;

router.post('/', (req, res) => {
  // ✅ Check if secrets are configured
  if (!REFRESH_SECRET || !ACCESS_SECRET) {
    return res.status(500).json({ error: 'Server configuration error: Authentication secrets not found' });
  }

  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ error: 'No refresh token found' });
  }

  try {
    const payload = jwt.verify(token, REFRESH_SECRET);

    const newAccessToken = jwt.sign(
      { userId: payload.userId, email: payload.email },
      ACCESS_SECRET,
      { expiresIn: '30m' }
    );

    res.status(200).json({
      message: 'Access token refreshed ✅',
      token: newAccessToken,
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

module.exports = router;

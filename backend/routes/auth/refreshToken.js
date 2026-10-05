const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../../prisma/client');
const { setRefreshCookie, REFRESH_MAX_AGE } = require('../../utils/auth/cookies');
const router = express.Router();

const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TTL = `${Math.floor(REFRESH_MAX_AGE / 1000 / 86400)}d`;

router.post('/', async (req, res) => {
  // ✅ Check if secrets are configured
  if (!REFRESH_SECRET || !ACCESS_SECRET) {
    return res.status(500).json({ success: false, error: 'Server configuration error: Authentication secrets not found' });
  }

  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ success: false, error: 'No refresh token found' });
  }

  try {
    const payload = jwt.verify(token, REFRESH_SECRET);

    // The role must come from the database, not from the old refresh token.
    // Re-signing straight from the stored payload dropped `role`, so every
    // request made with a refreshed access token failed requireAdmin with 403 —
    // the admin dashboard broke ~30 minutes after signing in.
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      // Account was deleted while the refresh token was still valid.
      return res.status(401).json({ success: false, error: 'Account no longer exists' });
    }

    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      ACCESS_SECRET,
      { expiresIn: '30m' }
    );

    // Rotate the refresh token so a captured cookie has a bounded lifetime.
    const newRefreshToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      REFRESH_SECRET,
      { expiresIn: REFRESH_TTL }
    );
    setRefreshCookie(res, newRefreshToken);

    res.status(200).json({
      message: 'Access token refreshed ✅',
      token: newAccessToken,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(403).json({ success: false, error: 'Invalid refresh token' });
  }
});

module.exports = router;
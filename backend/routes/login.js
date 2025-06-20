const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../generated/prisma'); // your Prisma client
const router = express.Router();

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;

router.post('/login', async (req, res) => {
  // ✅ Check if secrets are configured
  if (!ACCESS_SECRET || !REFRESH_SECRET) {
    return res.status(500).json({ error: 'Server configuration error: Authentication secrets not found' });
  }

  const { email, password } = req.body;

  // ✅ Input check
  if (!email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    // ✅ Check user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Wrong password' });

    // ✅ Generate Access Token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      ACCESS_SECRET,
      { expiresIn: '30m' }
    );

    // ✅ Generate Refresh Token
    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ Set Refresh Token in Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // ✅ Send Access Token
    res.status(200).json({
      message: 'Login successful ✅',
      token: accessToken,
      user: { id: user.id, name: user.name, email: user.email },
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Login failed due to server error' });
  }
});

module.exports = router;

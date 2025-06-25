const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = require('../../prisma/client');
const { sendPasswordResetEmail } = require('../../utils/email');
const router = express.Router();



router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Verification token is required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return res.status(404).json({ error: 'Invalid verification token.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null, // Clear the token after use
      },
    });

    // In a real app, you'd redirect to the frontend:
    // res.redirect('http://localhost:5173/email-verified');
    res.status(200).json({ message: 'Email verified successfully! You can now log in.' });

  } catch (error) {
    console.error('Error during email verification:', error);
    res.status(500).json({ error: 'Internal server error during email verification.' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Important: Always send a success response, even if the user doesn't exist.
    // This prevents attackers from guessing which emails are registered.
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const oneHour = 3600000; // 1 hour in milliseconds
      const passwordResetExpires = new Date(Date.now() + oneHour);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: passwordResetExpires,
        },
      });

      await sendPasswordResetEmail(user.email, resetToken);
    }

    res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });

  } catch (error) {
    console.error('Error during forgot password request:', error);
    // Generic error to avoid leaking information
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token },
    });

    if (!user || user.passwordResetExpires < new Date()) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null, // Clear the token
        passwordResetExpires: null, // Clear the expiration
      },
    });

    res.status(200).json({ message: 'Password has been reset successfully.' });

  } catch (error) {
    console.error('Error during password reset:', error);
    res.status(500).json({ error: 'An error occurred while resetting your password.' });
  }
});

module.exports = router;

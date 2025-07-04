const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = require('../../prisma/client');
const { sendVerificationEmail } = require('../../utils/email'); // Import our email function
const router = express.Router();



router.post('/', async (req, res) => {
  const { name, email, password } = req.body;

  // Input Validation
  if (!name || !email || !password) {
    return res.status(400).json({ 
      error: 'All fields are required.',
      details: 'Name, email, and password must be provided.'
    });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  // Password validation (minimum 6 characters)
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Generate a verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create new user in database
    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        emailVerificationToken: verificationToken, // Save the token
      }
    });
    
    // Send the verification email
    await sendVerificationEmail(newUser.email, verificationToken);

    // Return success response (exclude password from response)
    res.status(201).json({
      message: 'User created successfully! Please check your email to verify your account.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isEmailVerified: newUser.isEmailVerified,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'Internal server error during user creation.' });
  }
});

module.exports = router; 
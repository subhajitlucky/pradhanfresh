const nodemailer = require('nodemailer');

// For development, we'll use the "json" transport.
// This captures the email object as JSON without trying to send it.
const transporter = nodemailer.createTransport({
  jsonTransport: true,
});

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `http://localhost:5000/api/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: '"PradhanFresh" <no-reply@pradhanfresh.com>',
    to: email,
    subject: 'Please Verify Your Email Address',
    html: `
      <h1>Email Verification</h1>
      <p>Thank you for registering with PradhanFresh!</p>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>If you did not create an account, please ignore this email.</p>
    `
  };

  try {
    // The 'info' object contains the captured email as a JSON string
    const info = await transporter.sendMail(mailOptions);
    console.log('--- Verification Email Captured ---');
    // We parse and log the message so we can see the HTML content
    console.log(JSON.parse(info.message));
    console.log('---------------------------------');
  } catch (error) {
    console.error('Error capturing verification email:', error);
  }
};

const sendPasswordResetEmail = async (email, token) => {
  // In a real app, this URL would point to your frontend password reset page
  const resetUrl = `http://localhost:5173/reset-password?token=${token}`;

  const mailOptions = {
    from: '"PradhanFresh" <no-reply@pradhanfresh.com>',
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset</h1>
      <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
      <p>Please click on the following link, or paste it into your browser to complete the process within one hour of receiving it:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('--- Password Reset Email Captured ---');
    console.log(JSON.parse(info.message));
    console.log('-----------------------------------');
  } catch (error) {
    console.error('Error capturing password reset email:', error);
  }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail }; 
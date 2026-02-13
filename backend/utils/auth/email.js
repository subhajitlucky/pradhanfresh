const nodemailer = require('nodemailer');

/**
 * Configure email transporter
 * In development, we capture emails as JSON
 * In production, configure with SMTP settings
 */
const transporter = nodemailer.createTransport(
  process.env.NODE_ENV === 'production' 
  ? {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT == 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    }
  : {
      jsonTransport: true,
    }
);

/**
 * Send email verification link
 */
const sendVerificationEmail = async (email, token) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"PradhanFresh" <${process.env.EMAIL_FROM || 'no-reply@pradhanfresh.com'}>`,
    to: email,
    subject: '🥬 Verify your PradhanFresh Account',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #2e7d32;">Welcome to PradhanFresh!</h2>
        <p>Thank you for choosing us for your fresh produce. Please verify your email address to activate your account and start shopping.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p style="font-size: 0.9em; color: #666;">If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 0.8em; color: #888;">${verificationUrl}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.8em; color: #999;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `
  };

  await deliverEmail(mailOptions, 'Verification');
};

/**
 * Send password reset link
 */
const sendPasswordResetEmail = async (email, token) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"PradhanFresh" <${process.env.EMAIL_FROM || 'no-reply@pradhanfresh.com'}>`,
    to: email,
    subject: '🔐 Reset your PradhanFresh Password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #d32f2f;">Password Reset Request</h2>
        <p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="font-size: 0.9em; color: #666;">This link will expire in 1 hour.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.8em; color: #999;">PradhanFresh Security Team</p>
      </div>
    `
  };

  await deliverEmail(mailOptions, 'Password Reset');
};

/**
 * Helper to handle email delivery and logging
 */
const deliverEmail = async (options, type) => {
  try {
    const info = await transporter.sendMail(options);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`--- ${type} Email Captured (Dev Mode) ---`);
      console.log(JSON.parse(info.message));
      console.log('-----------------------------------');
    }
  } catch (error) {
    console.error(`Error delivering ${type} email:`, error);
    throw new Error('Email delivery failed');
  }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail }; 
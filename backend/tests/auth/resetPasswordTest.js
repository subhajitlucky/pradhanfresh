const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

describe('Auth - Reset Password Tests', () => {
  let testUser;
  let resetToken;
  let expiredToken;

  beforeEach(async () => {
    // Create test user with reset token
    resetToken = crypto.randomBytes(32).toString('hex');
    expiredToken = crypto.randomBytes(32).toString('hex');
    
    const hashedPassword = await bcrypt.hash('originalpassword', 10);
    const oneHour = 3600000; // 1 hour in milliseconds
    
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'resetpassword@example.com',
        password: hashedPassword,
        isEmailVerified: true,
        passwordResetToken: resetToken,
        passwordResetExpires: new Date(Date.now() + oneHour),
      },
    });

    // Create user with expired token for testing
    await prisma.user.create({
      data: {
        name: 'Expired User',
        email: 'expired@example.com',
        password: hashedPassword,
        isEmailVerified: true,
        passwordResetToken: expiredToken,
        passwordResetExpires: new Date(Date.now() - oneHour), // Expired 1 hour ago
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['resetpassword@example.com', 'expired@example.com']
        }
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/reset-password', () => {
    test('should reset password successfully with valid token', async () => {
      const newPassword = 'newpassword123';
      
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password has been reset successfully.');

      // Verify password was changed in database
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      
      expect(updatedUser.passwordResetToken).toBeNull();
      expect(updatedUser.passwordResetExpires).toBeNull();
      
      // Verify new password works
      const passwordMatch = await bcrypt.compare(newPassword, updatedUser.password);
      expect(passwordMatch).toBe(true);
      
      // Verify old password doesn't work
      const oldPasswordMatch = await bcrypt.compare('originalpassword', updatedUser.password);
      expect(oldPasswordMatch).toBe(false);
    });

    test('should fail with missing token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          password: 'newpassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Token and new password are required.');
    });

    test('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Token and new password are required.');
    });

    test('should fail with empty token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: '',
          password: 'newpassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Token and new password are required.');
    });

    test('should fail with empty password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Token and new password are required.');
    });

    test('should fail with short password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: '12345', // Only 5 characters
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password must be at least 6 characters long.');
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token-12345',
          password: 'newpassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password reset token is invalid or has expired.');
    });

    test('should fail with expired token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: expiredToken,
          password: 'newpassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password reset token is invalid or has expired.');
    });

    test('should fail with already used token', async () => {
      const newPassword = 'newpassword123';
      
      // First use of token (should succeed)
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword,
        });

      // Second use of same token (should fail)
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'anotherpassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password reset token is invalid or has expired.');
    });

    test('should properly hash new password', async () => {
      const newPassword = 'newhashedpassword123';
      
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword,
        });

      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });

      expect(updatedUser.password).not.toBe(newPassword);
      expect(updatedUser.password).toMatch(/^\$2b\$10\$/); // bcrypt hash pattern
    });

    test('should clear reset token and expiry after successful reset', async () => {
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'newpassword123',
        });

      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });

      expect(updatedUser.passwordResetToken).toBeNull();
      expect(updatedUser.passwordResetExpires).toBeNull();
    });

    test('should preserve other user data during password reset', async () => {
      const originalUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });

      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'newpassword123',
        });

      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });

      expect(updatedUser.name).toBe(originalUser.name);
      expect(updatedUser.email).toBe(originalUser.email);
      expect(updatedUser.isEmailVerified).toBe(originalUser.isEmailVerified);
      expect(updatedUser.role).toBe(originalUser.role);
      expect(updatedUser.createdAt).toEqual(originalUser.createdAt);
    });
  });
});

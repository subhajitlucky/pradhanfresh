const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const bcrypt = require('bcrypt');

describe('Auth - Forgot Password Tests', () => {
  let testUser;

  beforeEach(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('originalpassword', 10);
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'forgotpassword@example.com',
        password: hashedPassword,
        isEmailVerified: true,
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['forgotpassword@example.com', 'nonexistent@example.com']
        }
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/forgot-password', () => {
    test('should send password reset email for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'forgotpassword@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('If an account with that email exists, a password reset link has been sent.');

      // Verify reset token and expiry were set in database
      const updatedUser = await prisma.user.findUnique({
        where: { email: 'forgotpassword@example.com' }
      });
      expect(updatedUser.passwordResetToken).toBeTruthy();
      expect(updatedUser.passwordResetExpires).toBeTruthy();
      expect(updatedUser.passwordResetToken).toHaveLength(64); // 32 bytes in hex = 64 chars
      
      // Verify expiry is set to approximately 1 hour from now
      const expiryTime = new Date(updatedUser.passwordResetExpires);
      const expectedExpiry = new Date(Date.now() + 3600000); // 1 hour
      const timeDifference = Math.abs(expiryTime.getTime() - expectedExpiry.getTime());
      expect(timeDifference).toBeLessThan(5000); // Within 5 seconds tolerance
    });

    test('should return success message for non-existent user (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('If an account with that email exists, a password reset link has been sent.');

      // Verify no user was created or modified
      const user = await prisma.user.findUnique({
        where: { email: 'nonexistent@example.com' }
      });
      expect(user).toBeNull();
    });

    test('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('An error occurred while processing your request.');
    });

    test('should fail with empty email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: '',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('An error occurred while processing your request.');
    });

    test('should update existing reset token if user requests again', async () => {
      // First request
      await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'forgotpassword@example.com',
        });

      const firstUser = await prisma.user.findUnique({
        where: { email: 'forgotpassword@example.com' }
      });
      const firstToken = firstUser.passwordResetToken;

      // Wait a moment to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 100));

      // Second request
      await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'forgotpassword@example.com',
        });

      const secondUser = await prisma.user.findUnique({
        where: { email: 'forgotpassword@example.com' }
      });
      const secondToken = secondUser.passwordResetToken;

      expect(secondToken).not.toBe(firstToken);
      expect(secondToken).toBeTruthy();
    });

    test('should handle invalid email format gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'invalid-email-format',
        });

      // Should still return success message for security
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('If an account with that email exists, a password reset link has been sent.');
    });

    test('should preserve original password after forgot password request', async () => {
      const originalUser = await prisma.user.findUnique({
        where: { email: 'forgotpassword@example.com' }
      });
      const originalPassword = originalUser.password;

      await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'forgotpassword@example.com',
        });

      const updatedUser = await prisma.user.findUnique({
        where: { email: 'forgotpassword@example.com' }
      });

      expect(updatedUser.password).toBe(originalPassword);
    });
  });
});

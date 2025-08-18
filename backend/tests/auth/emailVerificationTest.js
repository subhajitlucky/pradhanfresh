const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const crypto = require('crypto');

describe('Auth - Email Verification Tests', () => {
  let testUser;
  let verificationToken;

  beforeEach(async () => {
    // Create test user with verification token
    verificationToken = crypto.randomBytes(32).toString('hex');
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'verification@example.com',
        password: 'hashedpassword',
        isEmailVerified: false,
        emailVerificationToken: verificationToken,
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['verification@example.com', 'verified@example.com']
        }
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/auth/verify-email', () => {
    test('should verify email successfully with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-email')
        .query({ token: verificationToken });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Email verified successfully! You can now log in.');

      // Verify user is updated in database
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(updatedUser.isEmailVerified).toBe(true);
      expect(updatedUser.emailVerificationToken).toBeNull();
    });

    test('should fail verification with missing token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-email');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Verification token is required.');
    });

    test('should fail verification with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-email')
        .query({ token: 'invalid-token-12345' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Invalid verification token.');
    });

    test('should fail verification with expired/used token', async () => {
      // First, verify the email (uses the token)
      await request(app)
        .get('/api/auth/verify-email')
        .query({ token: verificationToken });

      // Try to use the same token again
      const response = await request(app)
        .get('/api/auth/verify-email')
        .query({ token: verificationToken });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Invalid verification token.');
    });

    test('should not affect already verified user', async () => {
      // Create already verified user
      const verifiedUser = await prisma.user.create({
        data: {
          name: 'Already Verified',
          email: 'verified@example.com',
          password: 'hashedpassword',
          isEmailVerified: true,
          emailVerificationToken: null,
        },
      });

      // Try to verify with a random token (should fail)
      const response = await request(app)
        .get('/api/auth/verify-email')
        .query({ token: 'some-random-token' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Invalid verification token.');

      // Verify user status unchanged
      const unchangedUser = await prisma.user.findUnique({
        where: { id: verifiedUser.id }
      });
      expect(unchangedUser.isEmailVerified).toBe(true);
    });

    test('should handle empty token parameter', async () => {
      const response = await request(app)
        .get('/api/auth/verify-email')
        .query({ token: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Verification token is required.');
    });

    test('should clear token after successful verification', async () => {
      await request(app)
        .get('/api/auth/verify-email')
        .query({ token: verificationToken });

      const verifiedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });

      expect(verifiedUser.emailVerificationToken).toBeNull();
      expect(verifiedUser.isEmailVerified).toBe(true);
    });
  });
});

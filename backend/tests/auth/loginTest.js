const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const bcrypt = require('bcrypt');

describe('Auth - Login Tests', () => {
  let testUser;

  beforeAll(async () => {
    // Create a test user with verified email for login tests
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'testuser@example.com',
        password: hashedPassword,
        isEmailVerified: true, // Verified user for login tests
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['testuser@example.com', 'unverified@example.com']
        }
      }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'testpassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful ✅');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toEqual({
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        role: testUser.role,
      });
    });

    test('should fail login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'testpassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('All fields required');
    });

    test('should fail login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('All fields required');
    });

    test('should fail login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'testpassword123',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('User not found');
    });

    test('should fail login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Wrong password');
    });

    test('should fail login with unverified email', async () => {
      // Create unverified user
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      const unverifiedUser = await prisma.user.create({
        data: {
          name: 'Unverified User',
          email: 'unverified@example.com',
          password: hashedPassword,
          isEmailVerified: false,
        },
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unverified@example.com',
          password: 'testpassword123',
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Please verify your email before logging in.');
    });

    test('should set refresh token cookie on successful login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'testpassword123',
        });

      expect(response.status).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('refreshToken');
    });
  });
});

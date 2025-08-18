const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');

describe('Auth - Signup Tests', () => {
  afterEach(async () => {
    // Clean up test data after each test
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'newuser@example.com',
            'duplicate@example.com',
            'invalid-email',
            'test@example.com'
          ]
        }
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/signup', () => {
    test('should create new user successfully with valid data', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User created successfully! Please check your email to verify your account.');
      expect(response.body.user).toEqual({
        id: expect.any(Number),
        name: userData.name,
        email: userData.email,
        isEmailVerified: false,
        createdAt: expect.any(String),
      });

      // Verify user was created in database
      const createdUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      expect(createdUser).toBeTruthy();
      expect(createdUser.name).toBe(userData.name);
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.isEmailVerified).toBe(false);
      expect(createdUser.emailVerificationToken).toBeTruthy();
    });

    test('should fail signup with missing name', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('All fields are required.');
      expect(response.body.details).toBe('Name, email, and password must be provided.');
    });

    test('should fail signup with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('All fields are required.');
    });

    test('should fail signup with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('All fields are required.');
    });

    test('should fail signup with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid email format.');
    });

    test('should fail signup with short password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '12345', // Only 5 characters
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password must be at least 6 characters long.');
    });

    test('should fail signup with duplicate email', async () => {
      const userData = {
        name: 'First User',
        email: 'duplicate@example.com',
        password: 'password123',
      };

      // Create first user
      await request(app)
        .post('/api/auth/signup')
        .send(userData);

      // Try to create second user with same email
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Second User',
          email: 'duplicate@example.com',
          password: 'password456',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('User with this email already exists.');
    });

    test('should hash password correctly', async () => {
      const userData = {
        name: 'Password Test User',
        email: 'passwordtest@example.com',
        password: 'plainpassword123',
      };

      await request(app)
        .post('/api/auth/signup')
        .send(userData);

      const createdUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      expect(createdUser.password).not.toBe(userData.password);
      expect(createdUser.password).toMatch(/^\$2b\$10\$/); // bcrypt hash pattern
    });

    test('should generate verification token', async () => {
      const userData = {
        name: 'Token Test User',
        email: 'tokentest@example.com',
        password: 'password123',
      };

      await request(app)
        .post('/api/auth/signup')
        .send(userData);

      const createdUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      expect(createdUser.emailVerificationToken).toBeTruthy();
      expect(createdUser.emailVerificationToken).toHaveLength(64); // 32 bytes in hex = 64 chars
    });
  });
});

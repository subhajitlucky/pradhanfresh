const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Admin - User Management Tests', () => {
  let adminUser;
  let regularUser;
  let anotherUser;
  let adminToken;
  let userToken;

  beforeAll(async () => {
    // Create admin user
    const hashedPassword = await bcrypt.hash('adminpassword', 10);
    adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });

    // Create regular users
    regularUser = await prisma.user.create({
      data: {
        name: 'Regular User',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'USER',
        isEmailVerified: true,
      },
    });

    anotherUser = await prisma.user.create({
      data: {
        name: 'Another User',
        email: 'another@example.com',
        password: hashedPassword,
        role: 'USER',
        isEmailVerified: false,
      },
    });

    // Generate tokens
    adminToken = jwt.sign(
      { userId: adminUser.id, email: adminUser.email, role: adminUser.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '30m' }
    );

    userToken = jwt.sign(
      { userId: regularUser.id, email: regularUser.email, role: regularUser.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '30m' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: { in: ['admin@example.com', 'user@example.com', 'another@example.com'] }
      }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/admin/users', () => {
    test('should get all users with admin token', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThanOrEqual(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/admin/users');

      expect(response.status).toBe(401);
    });

    test('should fail with regular user token', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    test('should include user details but exclude sensitive information', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const user = response.body.data.users[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('isEmailVerified');
      expect(user).toHaveProperty('createdAt');
      expect(user).not.toHaveProperty('password'); // Should not include password
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.users.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination).toMatchObject({
        currentPage: 1,
        limit: 2,
        totalPages: expect.any(Number),
        totalUsers: expect.any(Number),
        hasNextPage: expect.any(Boolean),
        hasPrevPage: false,
      });
    });

    test('should support search by name', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .query({ search: 'Regular' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const users = response.body.data.users;
      expect(users.length).toBeGreaterThan(0);
      expect(users[0].name).toContain('Regular');
    });

    test('should support search by email', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .query({ search: 'user@example.com' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const users = response.body.data.users;
      expect(users.length).toBeGreaterThan(0);
      expect(users[0].email).toBe('user@example.com');
    });

    test('should filter by role', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .query({ role: 'USER' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const users = response.body.data.users;
      users.forEach(user => {
        expect(user.role).toBe('USER');
      });
    });

    test('should filter by email verification status', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .query({ isEmailVerified: 'false' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const users = response.body.data.users;
      users.forEach(user => {
        expect(user.isEmailVerified).toBe(false);
      });
    });

    test('should support sorting by creation date', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .query({ sortBy: 'createdAt', sortOrder: 'desc' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const users = response.body.data.users;
      for (let i = 1; i < users.length; i++) {
        const prevDate = new Date(users[i - 1].createdAt);
        const currDate = new Date(users[i].createdAt);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });

    test('should handle empty search results', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .query({ search: 'nonexistentuser123' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.users).toHaveLength(0);
      expect(response.body.data.pagination.totalUsers).toBe(0);
    });

    test('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .query({ page: -1, limit: 0 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    test('should get specific user details with admin token', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        id: regularUser.id,
        name: regularUser.name,
        email: regularUser.email,
        role: regularUser.role,
        isEmailVerified: regularUser.isEmailVerified,
      });
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${regularUser.id}`);

      expect(response.status).toBe(401);
    });

    test('should fail with regular user token', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    test('should fail with invalid user ID', async () => {
      const response = await request(app)
        .get('/api/admin/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with non-existent user ID', async () => {
      const response = await request(app)
        .get('/api/admin/users/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });

    test('should include additional user statistics', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user).toHaveProperty('createdAt');
      expect(response.body.data.user).toHaveProperty('updatedAt');
      // Additional statistics might be included based on implementation
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    test('should update user role successfully', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated successfully');
      expect(response.body.data.user.role).toBe('ADMIN');

      // Verify in database
      const updatedUser = await prisma.user.findUnique({
        where: { id: regularUser.id }
      });
      expect(updatedUser.role).toBe('ADMIN');

      // Reset for other tests
      await prisma.user.update({
        where: { id: regularUser.id },
        data: { role: 'USER' }
      });
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUser.id}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(401);
    });

    test('should fail with regular user token', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(403);
    });

    test('should fail with invalid user ID', async () => {
      const response = await request(app)
        .put('/api/admin/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with non-existent user ID', async () => {
      const response = await request(app)
        .put('/api/admin/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should fail with missing role', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid role', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'INVALID_ROLE' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should allow updating from USER to ADMIN', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${anotherUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(200);
      expect(response.body.data.user.role).toBe('ADMIN');

      // Reset
      await prisma.user.update({
        where: { id: anotherUser.id },
        data: { role: 'USER' }
      });
    });

    test('should allow updating from ADMIN to USER', async () => {
      // First make user an admin
      await prisma.user.update({
        where: { id: anotherUser.id },
        data: { role: 'ADMIN' }
      });

      const response = await request(app)
        .put(`/api/admin/users/${anotherUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'USER' });

      expect(response.status).toBe(200);
      expect(response.body.data.user.role).toBe('USER');
    });

    test('should not allow updating own role', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'USER' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('cannot change your own role');
    });

    test('should preserve other user data when updating role', async () => {
      const originalUser = await prisma.user.findUnique({
        where: { id: regularUser.id }
      });

      const response = await request(app)
        .put(`/api/admin/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(200);
      
      const updatedUser = await prisma.user.findUnique({
        where: { id: regularUser.id }
      });

      expect(updatedUser.name).toBe(originalUser.name);
      expect(updatedUser.email).toBe(originalUser.email);
      expect(updatedUser.isEmailVerified).toBe(originalUser.isEmailVerified);
      expect(updatedUser.createdAt).toEqual(originalUser.createdAt);

      // Reset
      await prisma.user.update({
        where: { id: regularUser.id },
        data: { role: 'USER' }
      });
    });

    test('should update updatedAt timestamp', async () => {
      const originalUser = await prisma.user.findUnique({
        where: { id: regularUser.id }
      });

      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay

      const response = await request(app)
        .put(`/api/admin/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(200);

      const updatedUser = await prisma.user.findUnique({
        where: { id: regularUser.id }
      });

      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUser.updatedAt.getTime());

      // Reset
      await prisma.user.update({
        where: { id: regularUser.id },
        data: { role: 'USER' }
      });
    });
  });
});

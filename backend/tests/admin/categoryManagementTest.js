const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Admin - Category Management Tests', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let userToken;
  let testCategory;

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

    // Create regular user
    regularUser = await prisma.user.create({
      data: {
        name: 'Regular User',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'USER',
        isEmailVerified: true,
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

  beforeEach(async () => {
    // Create a test category for each test
    testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        description: 'Test category description',
        slug: 'test-category',
      },
    });
  });

  afterEach(async () => {
    // Clean up categories after each test
    await prisma.category.deleteMany({
      where: {
        name: {
          in: ['Test Category', 'New Category', 'Updated Category', 'Another Category']
        }
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: { in: ['admin@example.com', 'user@example.com'] }
      }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/admin/categories', () => {
    test('should create category successfully with admin token', async () => {
      const categoryData = {
        name: 'New Category',
        description: 'New category description',
      };

      const response = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category created successfully');
      expect(response.body.data).toMatchObject({
        name: categoryData.name,
        description: categoryData.description,
        slug: expect.any(String),
      });

      // Verify category was created in database
      const createdCategory = await prisma.category.findUnique({
        where: { name: categoryData.name }
      });
      expect(createdCategory).toBeTruthy();
      expect(createdCategory.slug).toMatch(/^new-category/);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/admin/categories')
        .send({
          name: 'Test Category',
          description: 'Test description',
        });

      expect(response.status).toBe(401);
    });

    test('should fail with regular user token', async () => {
      const response = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Category',
          description: 'Test description',
        });

      expect(response.status).toBe(403);
    });

    test('should fail with missing name', async () => {
      const response = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Test description',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with empty name', async () => {
      const response = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '',
          description: 'Test description',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should create category with minimal required fields', async () => {
      const response = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Minimal Category',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Minimal Category');
    });

    test('should fail with duplicate category name', async () => {
      const response = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: testCategory.name, // Duplicate name
          description: 'Different description',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    test('should generate unique slug automatically', async () => {
      const response = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Auto Slug Category',
          description: 'Test auto slug generation',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.slug).toBe('auto-slug-category');
    });

    test('should handle special characters in name', async () => {
      const response = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Special & Characters! Category',
          description: 'Test special characters',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.slug).toMatch(/^special.*characters.*category/);
    });
  });

  describe('PUT /api/admin/categories/:id', () => {
    test('should update category successfully', async () => {
      const updateData = {
        name: 'Updated Category',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/admin/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category updated successfully');
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);

      // Verify in database
      const updatedCategory = await prisma.category.findUnique({
        where: { id: testCategory.id }
      });
      expect(updatedCategory.name).toBe(updateData.name);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/admin/categories/${testCategory.id}`)
        .send({
          name: 'Updated Category',
        });

      expect(response.status).toBe(401);
    });

    test('should fail with regular user token', async () => {
      const response = await request(app)
        .put(`/api/admin/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated Category',
        });

      expect(response.status).toBe(403);
    });

    test('should fail with invalid category ID', async () => {
      const response = await request(app)
        .put('/api/admin/categories/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Category',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with non-existent category ID', async () => {
      const response = await request(app)
        .put('/api/admin/categories/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Category',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category not found');
    });

    test('should update only provided fields', async () => {
      const originalCategory = await prisma.category.findUnique({
        where: { id: testCategory.id }
      });

      const response = await request(app)
        .put(`/api/admin/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Only description updated',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(originalCategory.name); // Should remain unchanged
      expect(response.body.data.description).toBe('Only description updated');
    });

    test('should update slug when name changes', async () => {
      const response = await request(app)
        .put(`/api/admin/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Completely New Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.slug).toBe('completely-new-name');
      expect(response.body.data.slug).not.toBe(testCategory.slug);
    });

    test('should fail with duplicate name', async () => {
      // Create another category
      const anotherCategory = await prisma.category.create({
        data: {
          name: 'Another Category',
          description: 'Another description',
          slug: 'another-category',
        },
      });

      const response = await request(app)
        .put(`/api/admin/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: anotherCategory.name, // Duplicate name
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    test('should fail with empty name', async () => {
      const response = await request(app)
        .put(`/api/admin/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should allow updating with same name (no change)', async () => {
      const response = await request(app)
        .put(`/api/admin/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: testCategory.name,
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/admin/categories/:id', () => {
    test('should delete category successfully', async () => {
      const response = await request(app)
        .delete(`/api/admin/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category deleted successfully');
      expect(response.body.data.deletedCategory).toMatchObject({
        id: testCategory.id,
        name: testCategory.name,
        slug: testCategory.slug,
      });

      // Verify category was deleted from database
      const deletedCategory = await prisma.category.findUnique({
        where: { id: testCategory.id }
      });
      expect(deletedCategory).toBeNull();
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/admin/categories/${testCategory.id}`);

      expect(response.status).toBe(401);
    });

    test('should fail with regular user token', async () => {
      const response = await request(app)
        .delete(`/api/admin/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    test('should fail with invalid category ID', async () => {
      const response = await request(app)
        .delete('/api/admin/categories/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with non-existent category ID', async () => {
      const response = await request(app)
        .delete('/api/admin/categories/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category not found');
    });

    test('should handle category deletion with associated products', async () => {
      // Create a product in this category
      const product = await prisma.product.create({
        data: {
          name: 'Test Product',
          description: 'Test product in category',
          price: 100,
          categoryId: testCategory.id,
          thumbnail: 'test.jpg',
          sku: 'TEST001',
          unit: 'kg',
          stock: 10,
          slug: 'test-product',
          createdById: adminUser.id,
        },
      });

      const response = await request(app)
        .delete(`/api/admin/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Should fail due to foreign key constraint
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('cannot be deleted');

      // Clean up
      await prisma.product.delete({ where: { id: product.id } });
    });

    test('should return correct category information in response', async () => {
      const response = await request(app)
        .delete(`/api/admin/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.deletedCategory).toEqual({
        id: testCategory.id,
        name: testCategory.name,
        slug: testCategory.slug,
      });
    });

    test('should handle zero category ID', async () => {
      const response = await request(app)
        .delete('/api/admin/categories/0')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should handle negative category ID', async () => {
      const response = await request(app)
        .delete('/api/admin/categories/-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/categories', () => {
    test('should get all categories with admin token', async () => {
      // Create additional categories for testing
      await prisma.category.create({
        data: {
          name: 'Category 1',
          description: 'First category',
          slug: 'category-1',
        },
      });

      await prisma.category.create({
        data: {
          name: 'Category 2',
          description: 'Second category',
          slug: 'category-2',
        },
      });

      const response = await request(app)
        .get('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toBeDefined();
      expect(Array.isArray(response.body.data.categories)).toBe(true);
      expect(response.body.data.categories.length).toBeGreaterThanOrEqual(3);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/admin/categories');

      expect(response.status).toBe(401);
    });

    test('should fail with regular user token', async () => {
      const response = await request(app)
        .get('/api/admin/categories')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    test('should include category details', async () => {
      const response = await request(app)
        .get('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const category = response.body.data.categories[0];
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('description');
      expect(category).toHaveProperty('slug');
      expect(category).toHaveProperty('createdAt');
      expect(category).toHaveProperty('updatedAt');
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/admin/categories')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.categories.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    test('should support search', async () => {
      const response = await request(app)
        .get('/api/admin/categories')
        .query({ search: 'Test' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const categories = response.body.data.categories;
      categories.forEach(category => {
        expect(category.name.toLowerCase()).toContain('test');
      });
    });

    test('should return empty array when no categories exist', async () => {
      // Remove all categories temporarily
      await prisma.category.deleteMany({});

      const response = await request(app)
        .get('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.categories).toHaveLength(0);
    });
  });
});

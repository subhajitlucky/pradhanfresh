const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Product - Delete Product Tests', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let userToken;
  let testCategory;
  let testProduct;

  beforeAll(async () => {
    // Create test category
    testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        description: 'Test category for product deletion',
      },
    });

    // Create admin user
    const hashedPassword = await bcrypt.hash('adminpassword', 10);
    adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin',
        isEmailVerified: true,
      },
    });

    // Create regular user
    regularUser = await prisma.user.create({
      data: {
        name: 'Regular User',
        email: 'user@test.com',
        password: hashedPassword,
        role: 'user',
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
    // Create a test product for each test
    testProduct = await prisma.product.create({
      data: {
        name: 'Test Product To Delete',
        description: 'This product will be deleted in tests',
        price: 100,
        categoryId: testCategory.id,
        thumbnail: 'delete-test-product.jpg',
        sku: 'DELETE001',
        unit: 'kg',
        stock: 50,
        slug: 'test-product-to-delete',
        createdById: adminUser.id,
      },
    });
  });

  afterEach(async () => {
    // Clean up any remaining test products
    await prisma.product.deleteMany({
      where: {
        sku: { in: ['DELETE001', 'DELETE002'] }
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: { in: ['admin@test.com', 'user@test.com'] }
      }
    });
    await prisma.category.delete({
      where: { id: testCategory.id }
    });
    await prisma.$disconnect();
  });

  describe('DELETE /api/products/:id', () => {
    test('should delete product successfully with admin token', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product deleted successfully');
      expect(response.body.deletedProduct).toMatchObject({
        id: testProduct.id,
        name: testProduct.name,
        sku: testProduct.sku,
        category: testCategory.name,
        createdBy: adminUser.name,
      });

      // Verify product is actually deleted from database
      const deletedProduct = await prisma.product.findUnique({
        where: { id: testProduct.id }
      });
      expect(deletedProduct).toBeNull();
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct.id}`);

      expect(response.status).toBe(401);

      // Verify product still exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: testProduct.id }
      });
      expect(existingProduct).toBeTruthy();
    });

    test('should fail with regular user token', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);

      // Verify product still exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: testProduct.id }
      });
      expect(existingProduct).toBeTruthy();
    });

    test('should fail with invalid product ID', async () => {
      const response = await request(app)
        .delete('/api/products/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product ID must be a valid number');
    });

    test('should fail with non-existent product ID', async () => {
      const response = await request(app)
        .delete('/api/products/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product with ID 99999 not found');
    });

    test('should handle product already deleted (race condition)', async () => {
      // Delete the product first
      await request(app)
        .delete(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Try to delete again
      const response = await request(app)
        .delete(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should return correct product information in response', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.deletedProduct).toEqual({
        id: testProduct.id,
        name: testProduct.name,
        sku: testProduct.sku,
        category: testCategory.name,
        createdBy: adminUser.name,
      });
    });

    test('should handle zero product ID', async () => {
      const response = await request(app)
        .delete('/api/products/0')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should handle negative product ID', async () => {
      const response = await request(app)
        .delete('/api/products/-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should handle very large product ID', async () => {
      const response = await request(app)
        .delete('/api/products/999999999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    // Note: Foreign key constraint test would require setting up orders, reviews, etc.
    // This is a placeholder for when those relationships exist
    test('should handle foreign key constraints (when product is referenced)', async () => {
      // This test would check if a product that's referenced by orders/reviews
      // cannot be deleted and returns appropriate error
      // For now, we'll skip this test as it requires more complex setup
      
      const response = await request(app)
        .delete(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Should succeed since no foreign key references exist yet
      expect(response.status).toBe(200);
    });

    test('should completely remove product from database', async () => {
      const productId = testProduct.id;
      
      await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Verify product is completely gone
      const deletedProduct = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          createdBy: true,
        }
      });

      expect(deletedProduct).toBeNull();
    });

    test('should not affect other products when deleting one', async () => {
      // Create another product
      const anotherProduct = await prisma.product.create({
        data: {
          name: 'Another Product',
          description: 'This should not be deleted',
          price: 200,
          categoryId: testCategory.id,
          thumbnail: 'another-product.jpg',
          sku: 'DELETE002',
          unit: 'piece',
          stock: 25,
          slug: 'another-product',
          createdById: adminUser.id,
        },
      });

      // Delete the first product
      await request(app)
        .delete(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Verify the other product still exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: anotherProduct.id }
      });
      expect(existingProduct).toBeTruthy();
      expect(existingProduct.name).toBe('Another Product');
    });
  });
});

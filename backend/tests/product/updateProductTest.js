const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Product - Update Product Tests', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let userToken;
  let testCategory;
  let testProduct;
  let anotherProduct;

  beforeAll(async () => {
    // Create test category
    testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        description: 'Test category for product updates',
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
    // Create test products for each test
    testProduct = await prisma.product.create({
      data: {
        name: 'Test Product',
        description: 'Original test product description',
        shortDescription: 'Original short description',
        price: 100,
        salePrice: 80,
        categoryId: testCategory.id,
        thumbnail: 'test-product.jpg',
        sku: 'TEST001',
        unit: 'kg',
        stock: 50,
        weight: 1.5,
        isFeatured: false,
        isOrganic: false,
        slug: 'test-product',
        createdById: adminUser.id,
      },
    });

    anotherProduct = await prisma.product.create({
      data: {
        name: 'Another Product',
        description: 'Another product for SKU uniqueness tests',
        price: 200,
        categoryId: testCategory.id,
        thumbnail: 'another-product.jpg',
        sku: 'ANOTHER001',
        unit: 'piece',
        stock: 25,
        slug: 'another-product',
        createdById: adminUser.id,
      },
    });
  });

  afterEach(async () => {
    // Clean up products after each test
    await prisma.product.deleteMany({
      where: {
        sku: { in: ['TEST001', 'ANOTHER001', 'UPDATED001'] }
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

  describe('PUT /api/products/:id', () => {
    test('should update product successfully with admin token', async () => {
      const updateData = {
        name: 'Updated Product Name',
        description: 'Updated product description',
        price: 150,
        stock: 75,
        isFeatured: true,
      };

      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product updated successfully');
      expect(response.body.data).toMatchObject({
        name: updateData.name,
        description: updateData.description,
        price: updateData.price,
        stock: updateData.stock,
        isFeatured: updateData.isFeatured,
      });
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(401);
    });

    test('should fail with regular user token', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(403);
    });

    test('should fail with invalid product ID', async () => {
      const response = await request(app)
        .put('/api/products/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Product ID must be a valid number');
    });

    test('should fail with non-existent product ID', async () => {
      const response = await request(app)
        .put('/api/products/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Product with ID 99999 not found');
    });

    test('should fail with invalid price', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: -50 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with sale price higher than regular price', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 100,
          salePrice: 150 // Higher than regular price
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid category ID', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ categoryId: 99999 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with negative stock', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stock: -10 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with duplicate SKU', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sku: anotherProduct.sku });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    test('should allow updating with same SKU (no change)', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sku: testProduct.sku,
          name: 'Updated Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should update slug when name changes', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Completely New Product Name' });

      expect(response.status).toBe(200);
      expect(response.body.data.slug).toMatch(/completely-new-product-name/);
      expect(response.body.data.slug).not.toBe(testProduct.slug);
    });

    test('should not update slug when name stays the same', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: testProduct.name,
          price: 200
        });

      expect(response.status).toBe(200);
      expect(response.body.data.slug).toBe(testProduct.slug);
    });

    test('should fail when no fields are provided for update', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No valid fields provided for update');
    });

    test('should update only provided fields', async () => {
      const originalProduct = await prisma.product.findUnique({
        where: { id: testProduct.id }
      });

      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 300 });

      expect(response.status).toBe(200);
      expect(response.body.data.price).toBe(300);
      expect(response.body.data.name).toBe(originalProduct.name);
      expect(response.body.data.description).toBe(originalProduct.description);
    });

    test('should update sale price validation with existing price', async () => {
      // First update the regular price
      await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 200 });

      // Then try to set sale price higher than the new price
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ salePrice: 250 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should handle boolean field updates', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isFeatured: true,
          isOrganic: true,
          isAvailable: false
        });

      expect(response.status).toBe(200);
      expect(response.body.data.isFeatured).toBe(true);
      expect(response.body.data.isOrganic).toBe(true);
      expect(response.body.data.isAvailable).toBe(false);
    });

    test('should handle array field updates', async () => {
      const newImages = ['new-image1.jpg', 'new-image2.jpg', 'new-image3.jpg'];
      
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ images: newImages });

      expect(response.status).toBe(200);
      expect(response.body.data.images).toEqual(newImages);
    });

    test('should preserve original creation data', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.data.createdBy.id).toBe(adminUser.id);
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
    });
  });
});

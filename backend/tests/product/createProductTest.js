const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Product - Create Product Tests', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let userToken;
  let testCategory;

  beforeAll(async () => {
    // Create test category
    testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        description: 'Test category for product creation',
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

  afterAll(async () => {
    // Clean up test data
    await prisma.product.deleteMany({
      where: { categoryId: testCategory.id }
    });
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

  afterEach(async () => {
    // Clean up products created during tests
    await prisma.product.deleteMany({
      where: {
        sku: {
          in: ['TEST001', 'TEST002', 'INVALID', 'DUPLICATE001']
        }
      }
    });
  });

  describe('POST /api/products', () => {
    const validProductData = {
      name: 'Test Product',
      description: 'This is a test product description',
      shortDescription: 'Test product',
      price: 100,
      salePrice: 80,
      categoryId: null, // Will be set in tests
      thumbnail: 'test-product.jpg',
      sku: 'TEST001',
      unit: 'kg',
      stock: 50,
      weight: 1.5,
      isFeatured: true,
      isOrganic: false,
      images: ['image1.jpg', 'image2.jpg'],
    };

    beforeEach(() => {
      validProductData.categoryId = testCategory.id;
      validProductData.sku = 'TEST001';
    });

    test('should create product successfully with admin token', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProductData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product created successfully');
      expect(response.body.data).toMatchObject({
        name: validProductData.name,
        description: validProductData.description,
        price: validProductData.price,
        sku: validProductData.sku,
        category: expect.objectContaining({
          name: testCategory.name
        }),
        createdBy: expect.objectContaining({
          name: adminUser.name,
          email: adminUser.email
        })
      });
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/products')
        .send(validProductData);

      expect(response.status).toBe(401);
    });

    test('should fail with regular user token', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validProductData);

      expect(response.status).toBe(403);
    });

    test('should fail with missing required fields', async () => {
      const incompleteData = { ...validProductData };
      delete incompleteData.name;

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid price', async () => {
      const invalidData = {
        ...validProductData,
        price: -10 // Negative price
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with sale price higher than regular price', async () => {
      const invalidData = {
        ...validProductData,
        price: 50,
        salePrice: 100 // Sale price higher than regular price
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid category ID', async () => {
      const invalidData = {
        ...validProductData,
        categoryId: 99999 // Non-existent category
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with negative stock', async () => {
      const invalidData = {
        ...validProductData,
        stock: -5 // Negative stock
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with duplicate SKU', async () => {
      // Create first product
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProductData);

      // Try to create second product with same SKU
      const duplicateData = {
        ...validProductData,
        name: 'Another Product',
        sku: validProductData.sku // Same SKU
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    test('should generate unique slug automatically', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProductData);

      expect(response.status).toBe(201);
      expect(response.body.data.slug).toBeDefined();
      expect(response.body.data.slug).toMatch(/^test-product/);
    });

    test('should create product with minimal required fields', async () => {
      const minimalData = {
        name: 'Minimal Product',
        description: 'Minimal description',
        price: 25,
        categoryId: testCategory.id,
        thumbnail: 'minimal.jpg',
        sku: 'MIN001',
        unit: 'piece',
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(minimalData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stock).toBe(0); // Default stock
      expect(response.body.data.isFeatured).toBe(false); // Default featured
      expect(response.body.data.isOrganic).toBe(false); // Default organic
    });

    test('should handle missing thumbnail', async () => {
      const dataWithoutThumbnail = { ...validProductData };
      delete dataWithoutThumbnail.thumbnail;

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(dataWithoutThumbnail);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should handle empty string fields', async () => {
      const invalidData = {
        ...validProductData,
        name: '', // Empty name
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should handle invalid data types', async () => {
      const invalidData = {
        ...validProductData,
        price: 'invalid-price', // String instead of number
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});

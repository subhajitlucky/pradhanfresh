const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const bcrypt = require('bcrypt');

describe('Product - Get Product By ID Tests', () => {
  let testCategory;
  let testProduct;
  let adminUser;

  beforeAll(async () => {
    // Create test category
    testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        description: 'Test category for product retrieval',
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

    // Create test product
    testProduct = await prisma.product.create({
      data: {
        name: 'Test Product',
        description: 'Detailed test product description for retrieval tests',
        shortDescription: 'Short test description',
        price: 150,
        salePrice: 120,
        categoryId: testCategory.id,
        thumbnail: 'test-product.jpg',
        sku: 'TEST001',
        unit: 'kg',
        stock: 100,
        weight: 2.5,
        isFeatured: true,
        isOrganic: true,
        isAvailable: true,
        images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
        slug: 'test-product',
        createdById: adminUser.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.product.delete({
      where: { id: testProduct.id }
    });
    await prisma.user.delete({
      where: { id: adminUser.id }
    });
    await prisma.category.delete({
      where: { id: testCategory.id }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/products/:id', () => {
    test('should get product by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product retrieved successfully');
      expect(response.body.data).toMatchObject({
        id: testProduct.id,
        name: testProduct.name,
        description: testProduct.description,
        shortDescription: testProduct.shortDescription,
        price: testProduct.price,
        salePrice: testProduct.salePrice,
        sku: testProduct.sku,
        unit: testProduct.unit,
        stock: testProduct.stock,
        weight: testProduct.weight,
        isFeatured: testProduct.isFeatured,
        isOrganic: testProduct.isOrganic,
        isAvailable: testProduct.isAvailable,
        thumbnail: testProduct.thumbnail,
        images: testProduct.images,
        slug: testProduct.slug,
      });
    });

    test('should include category information', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.category).toBeDefined();
      expect(response.body.data.category).toMatchObject({
        id: testCategory.id,
        name: testCategory.name,
        description: testCategory.description,
      });
    });

    test('should include creator information', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.createdBy).toBeDefined();
      expect(response.body.data.createdBy).toMatchObject({
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
      });
    });

    test('should fail with invalid product ID format', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid product ID. ID must be a number.');
      expect(response.body.error).toBe('Bad Request');
    });

    test('should fail with non-existent product ID', async () => {
      const response = await request(app)
        .get('/api/products/99999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product with ID 99999 not found');
      expect(response.body.error).toBe('Not Found');
    });

    test('should handle zero product ID', async () => {
      const response = await request(app)
        .get('/api/products/0');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product with ID 0 not found');
    });

    test('should handle negative product ID', async () => {
      const response = await request(app)
        .get('/api/products/-1');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product with ID -1 not found');
    });

    test('should handle very large product ID', async () => {
      const response = await request(app)
        .get('/api/products/999999999999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should handle decimal product ID', async () => {
      const response = await request(app)
        .get('/api/products/123.45');

      expect(response.status).toBe(200);
      // parseInt(123.45) = 123, so it should try to find product with ID 123
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product with ID 123 not found');
    });

    test('should handle special characters in ID', async () => {
      const response = await request(app)
        .get('/api/products/abc123');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid product ID. ID must be a number.');
    });

    test('should not require authentication', async () => {
      // This test verifies that the endpoint is public
      const response = await request(app)
        .get(`/api/products/${testProduct.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should return all product fields', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct.id}`);

      expect(response.status).toBe(200);
      
      const product = response.body.data;
      
      // Check all expected fields are present
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('shortDescription');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('salePrice');
      expect(product).toHaveProperty('sku');
      expect(product).toHaveProperty('unit');
      expect(product).toHaveProperty('stock');
      expect(product).toHaveProperty('weight');
      expect(product).toHaveProperty('isFeatured');
      expect(product).toHaveProperty('isOrganic');
      expect(product).toHaveProperty('isAvailable');
      expect(product).toHaveProperty('thumbnail');
      expect(product).toHaveProperty('images');
      expect(product).toHaveProperty('slug');
      expect(product).toHaveProperty('createdAt');
      expect(product).toHaveProperty('updatedAt');
      expect(product).toHaveProperty('category');
      expect(product).toHaveProperty('createdBy');
    });

    test('should return correct data types for all fields', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct.id}`);

      expect(response.status).toBe(200);
      
      const product = response.body.data;
      
      expect(typeof product.id).toBe('number');
      expect(typeof product.name).toBe('string');
      expect(typeof product.description).toBe('string');
      expect(typeof product.price).toBe('number');
      expect(typeof product.sku).toBe('string');
      expect(typeof product.stock).toBe('number');
      expect(typeof product.isFeatured).toBe('boolean');
      expect(typeof product.isOrganic).toBe('boolean');
      expect(typeof product.isAvailable).toBe('boolean');
      expect(Array.isArray(product.images)).toBe(true);
      expect(typeof product.category).toBe('object');
      expect(typeof product.createdBy).toBe('object');
    });

    test('should handle product with minimal data', async () => {
      // Create a product with only required fields
      const minimalProduct = await prisma.product.create({
        data: {
          name: 'Minimal Product',
          description: 'Minimal description',
          price: 50,
          categoryId: testCategory.id,
          thumbnail: 'minimal.jpg',
          sku: 'MIN001',
          unit: 'piece',
          slug: 'minimal-product',
          createdById: adminUser.id,
        },
      });

      const response = await request(app)
        .get(`/api/products/${minimalProduct.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(minimalProduct.id);
      expect(response.body.data.name).toBe('Minimal Product');

      // Clean up
      await prisma.product.delete({
        where: { id: minimalProduct.id }
      });
    });
  });
});

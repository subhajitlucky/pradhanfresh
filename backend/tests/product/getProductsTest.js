const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');

describe('Product - Get Products Tests', () => {
  let testCategory;
  let testProducts = [];

  beforeAll(async () => {
    // Create test category
    testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        description: 'Test category for products',
      },
    });

    // Create test products
    const productsData = [
      {
        name: 'Apple',
        description: 'Fresh red apple',
        shortDescription: 'Fresh apple',
        price: 100,
        salePrice: 80,
        categoryId: testCategory.id,
        thumbnail: 'apple.jpg',
        sku: 'APPLE001',
        unit: 'kg',
        stock: 50,
        isFeatured: true,
        isOrganic: true,
        slug: 'apple',
      },
      {
        name: 'Orange',
        description: 'Fresh orange fruit',
        shortDescription: 'Fresh orange',
        price: 150,
        categoryId: testCategory.id,
        thumbnail: 'orange.jpg',
        sku: 'ORANGE001',
        unit: 'kg',
        stock: 30,
        isFeatured: false,
        isOrganic: false,
        slug: 'orange',
      },
      {
        name: 'Banana',
        description: 'Yellow banana bunch',
        shortDescription: 'Banana bunch',
        price: 50,
        categoryId: testCategory.id,
        thumbnail: 'banana.jpg',
        sku: 'BANANA001',
        unit: 'bunch',
        stock: 0, // Out of stock
        isFeatured: true,
        isOrganic: true,
        slug: 'banana',
        isAvailable: false,
      },
    ];

    for (const productData of productsData) {
      const product = await prisma.product.create({ data: productData });
      testProducts.push(product);
    }
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.product.deleteMany({
      where: { categoryId: testCategory.id }
    });
    await prisma.category.delete({
      where: { id: testCategory.id }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/products', () => {
    test('should get all products successfully', async () => {
      const response = await request(app)
        .get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Products retrieved successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.filters).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should get products with pagination', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.productsPerPage).toBe(2);
    });

    test('should search products by name', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ search: 'Apple' });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name.toLowerCase()).toContain('apple');
    });

    test('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ categories: testCategory.id.toString() });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(3); // All test products
      response.body.data.forEach(product => {
        expect(product.categoryId).toBe(testCategory.id);
      });
    });

    test('should filter products by price range', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ minPrice: 75, maxPrice: 125 });

      expect(response.status).toBe(200);
      response.body.data.forEach(product => {
        expect(product.price).toBeGreaterThanOrEqual(75);
        expect(product.price).toBeLessThanOrEqual(125);
      });
    });

    test('should filter organic products', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ isOrganic: 'true' });

      expect(response.status).toBe(200);
      response.body.data.forEach(product => {
        expect(product.isOrganic).toBe(true);
      });
    });

    test('should filter featured products', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ isFeatured: 'true' });

      expect(response.status).toBe(200);
      response.body.data.forEach(product => {
        expect(product.isFeatured).toBe(true);
      });
    });

    test('should filter available products (default)', async () => {
      const response = await request(app)
        .get('/api/products');

      expect(response.status).toBe(200);
      // Should not include out of stock products by default
      const productNames = response.body.data.map(p => p.name);
      expect(productNames).not.toContain('Banana'); // Out of stock product
    });

    test('should sort products by price ascending', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ sortBy: 'price', sortOrder: 'asc' });

      expect(response.status).toBe(200);
      const prices = response.body.data.map(p => p.price);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });

    test('should sort products by name descending', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ sortBy: 'name', sortOrder: 'desc' });

      expect(response.status).toBe(200);
      const names = response.body.data.map(p => p.name);
      for (let i = 1; i < names.length; i++) {
        expect(names[i].localeCompare(names[i - 1])).toBeLessThanOrEqual(0);
      }
    });

    test('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: -1, limit: 0 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should handle invalid sort parameters', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ sortBy: 'invalidField', sortOrder: 'invalidOrder' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should include category and creator information', async () => {
      const response = await request(app)
        .get('/api/products');

      expect(response.status).toBe(200);
      if (response.body.data.length > 0) {
        const product = response.body.data[0];
        expect(product.category).toBeDefined();
        expect(product.category.name).toBeDefined();
      }
    });

    test('should handle combined filters and search', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({
          search: 'apple',
          categories: testCategory.id.toString(),
          minPrice: 50,
          maxPrice: 200,
          isOrganic: 'true',
          sortBy: 'price',
          sortOrder: 'asc'
        });

      expect(response.status).toBe(200);
      expect(response.body.filters.appliedFilters).toBeDefined();
    });

    test('should return correct pagination metadata', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ limit: 1 });

      expect(response.status).toBe(200);
      expect(response.body.pagination).toMatchObject({
        currentPage: expect.any(Number),
        totalPages: expect.any(Number),
        totalProducts: expect.any(Number),
        productsPerPage: expect.any(Number),
        hasNextPage: expect.any(Boolean),
        hasPrevPage: expect.any(Boolean),
      });
    });
  });
});

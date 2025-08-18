const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Cart - Add To Cart Tests', () => {
  let testUser;
  let userToken;
  let testCategory;
  let testProduct;
  let unavailableProduct;
  let outOfStockProduct;

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('userpassword', 10);
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'testuser@example.com',
        password: hashedPassword,
        role: 'user',
        isEmailVerified: true,
      },
    });

    // Generate token
    userToken = jwt.sign(
      { userId: testUser.id, email: testUser.email, role: testUser.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '30m' }
    );

    // Create test category
    testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        description: 'Test category for cart tests',
      },
    });

    // Create test products
    testProduct = await prisma.product.create({
      data: {
        name: 'Test Product',
        description: 'Test product for cart tests',
        price: 100,
        salePrice: 80,
        categoryId: testCategory.id,
        thumbnail: 'test-product.jpg',
        sku: 'TEST001',
        unit: 'kg',
        stock: 50,
        isAvailable: true,
        slug: 'test-product',
        createdById: testUser.id,
      },
    });

    unavailableProduct = await prisma.product.create({
      data: {
        name: 'Unavailable Product',
        description: 'Unavailable product for testing',
        price: 150,
        categoryId: testCategory.id,
        thumbnail: 'unavailable-product.jpg',
        sku: 'UNAVAIL001',
        unit: 'kg',
        stock: 10,
        isAvailable: false, // Not available
        slug: 'unavailable-product',
        createdById: testUser.id,
      },
    });

    outOfStockProduct = await prisma.product.create({
      data: {
        name: 'Out of Stock Product',
        description: 'Out of stock product for testing',
        price: 200,
        categoryId: testCategory.id,
        thumbnail: 'out-of-stock.jpg',
        sku: 'OUTSTOCK001',
        unit: 'piece',
        stock: 0, // No stock
        isAvailable: true,
        slug: 'out-of-stock-product',
        createdById: testUser.id,
      },
    });
  });

  afterEach(async () => {
    // Clean up cart and cart items after each test
    await prisma.cartItem.deleteMany({
      where: { cart: { userId: testUser.id } }
    });
    await prisma.cart.deleteMany({
      where: { userId: testUser.id }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.product.deleteMany({
      where: { categoryId: testCategory.id }
    });
    await prisma.category.delete({
      where: { id: testCategory.id }
    });
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/cart', () => {
    test('should add item to cart successfully', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 2
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('added to cart successfully');
      expect(response.body.data.cart).toBeDefined();
      expect(response.body.data.itemsCount).toBe(1);
      expect(response.body.data.totalAmount).toBeGreaterThan(0);

      // Verify cart was created in database
      const cart = await prisma.cart.findUnique({
        where: { userId: testUser.id },
        include: { items: true }
      });
      expect(cart).toBeTruthy();
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.items[0].productId).toBe(testProduct.id);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/cart')
        .send({
          productId: testProduct.id,
          quantity: 1
        });

      expect(response.status).toBe(401);
    });

    test('should fail with missing productId', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quantity: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with missing quantity', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid productId', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: 'invalid-id',
          quantity: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with zero or negative quantity', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 0
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      const negativeResponse = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: -1
        });

      expect(negativeResponse.status).toBe(400);
      expect(negativeResponse.body.success).toBe(false);
    });

    test('should fail with non-existent product', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: 99999,
          quantity: 1
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });

    test('should fail with unavailable product', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: unavailableProduct.id,
          quantity: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Stock Error');
    });

    test('should fail with out of stock product', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: outOfStockProduct.id,
          quantity: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Stock Error');
    });

    test('should fail when quantity exceeds available stock', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 100 // Exceeds stock of 50
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Stock Error');
    });

    test('should create cart if user doesn\'t have one', async () => {
      // Ensure no cart exists
      await prisma.cart.deleteMany({
        where: { userId: testUser.id }
      });

      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify cart was created
      const cart = await prisma.cart.findUnique({
        where: { userId: testUser.id }
      });
      expect(cart).toBeTruthy();
    });

    test('should update quantity if product already in cart', async () => {
      // First, add item to cart
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 2
        });

      // Add same product again
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 3
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify quantity was updated (not added separately)
      const cart = await prisma.cart.findUnique({
        where: { userId: testUser.id },
        include: { items: true }
      });
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5); // 2 + 3
    });

    test('should calculate correct subtotal and total', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 2
        });

      expect(response.status).toBe(200);
      
      const expectedSubtotal = (testProduct.salePrice || testProduct.price) * 2;
      expect(response.body.data.totalAmount).toBe(expectedSubtotal);

      // Verify in database
      const cartItem = await prisma.cartItem.findFirst({
        where: { 
          cart: { userId: testUser.id },
          productId: testProduct.id
        }
      });
      expect(cartItem.subtotal).toBe(expectedSubtotal);
    });

    test('should use sale price if available', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 1
        });

      expect(response.status).toBe(200);
      
      // Should use sale price (80) instead of regular price (100)
      expect(response.body.data.totalAmount).toBe(testProduct.salePrice);
    });

    test('should handle large quantities within stock limit', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 50 // Maximum available stock
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should include complete cart data in response', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 2
        });

      expect(response.status).toBe(200);
      expect(response.body.data.cart).toMatchObject({
        id: expect.any(Number),
        userId: testUser.id,
        totalAmount: expect.any(Number),
        items: expect.any(Array),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      expect(response.body.data.cart.items[0]).toMatchObject({
        id: expect.any(Number),
        quantity: 2,
        subtotal: expect.any(Number),
        product: expect.objectContaining({
          id: testProduct.id,
          name: testProduct.name,
          price: testProduct.price,
          salePrice: testProduct.salePrice,
          thumbnail: testProduct.thumbnail,
          unit: testProduct.unit,
          stock: expect.any(Number),
          isAvailable: true
        })
      });
    });

    test('should handle maximum quantity per item limit', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 100 // Should be limited by validation/stock
        });

      // This should fail due to stock limit (50) before hitting quantity limit
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should update cart timestamp on addition', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 1
        });

      expect(response.status).toBe(200);

      const cart = await prisma.cart.findUnique({
        where: { userId: testUser.id }
      });
      expect(cart.updatedAt).toBeTruthy();
    });
  });
});

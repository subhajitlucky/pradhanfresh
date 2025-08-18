const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Cart - Get Cart Tests', () => {
  let testUser;
  let anotherUser;
  let userToken;
  let anotherUserToken;
  let testCategory;
  let testProduct;
  let anotherProduct;

  beforeAll(async () => {
    // Create test users
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

    anotherUser = await prisma.user.create({
      data: {
        name: 'Another User',
        email: 'anotheruser@example.com',
        password: hashedPassword,
        role: 'user',
        isEmailVerified: true,
      },
    });

    // Generate tokens
    userToken = jwt.sign(
      { userId: testUser.id, email: testUser.email, role: testUser.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '30m' }
    );

    anotherUserToken = jwt.sign(
      { userId: anotherUser.id, email: anotherUser.email, role: anotherUser.role },
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

    anotherProduct = await prisma.product.create({
      data: {
        name: 'Another Product',
        description: 'Another test product',
        price: 150,
        categoryId: testCategory.id,
        thumbnail: 'another-product.jpg',
        sku: 'TEST002',
        unit: 'piece',
        stock: 30,
        isAvailable: true,
        slug: 'another-product',
        createdById: testUser.id,
      },
    });
  });

  afterEach(async () => {
    // Clean up cart data after each test
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.product.deleteMany({
      where: { categoryId: testCategory.id }
    });
    await prisma.category.delete({
      where: { id: testCategory.id }
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ['testuser@example.com', 'anotheruser@example.com'] }
      }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/cart', () => {
    test('should return empty cart when user has no cart', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cart is empty');
      expect(response.body.data).toMatchObject({
        cart: null,
        itemsCount: 0,
        totalAmount: 0,
        isEmpty: true
      });
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/cart');

      expect(response.status).toBe(401);
    });

    test('should return cart with items', async () => {
      // Create cart with items
      const cart = await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 230,
        },
      });

      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: testProduct.id,
          quantity: 2,
          subtotal: 160, // 2 * 80 (sale price)
        },
      });

      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: anotherProduct.id,
          quantity: 1,
          subtotal: 150,
        },
      });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cart).toBeDefined();
      expect(response.body.data.itemsCount).toBe(2);
      expect(response.body.data.totalAmount).toBe(310); // Recalculated total
      expect(response.body.data.isEmpty).toBe(false);
      expect(response.body.data.cart.items).toHaveLength(2);
    });

    test('should include product details in cart items', async () => {
      // Create cart with item
      const cart = await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 160,
        },
      });

      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: testProduct.id,
          quantity: 2,
          subtotal: 160,
        },
      });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.cart.items[0]).toMatchObject({
        id: expect.any(Number),
        quantity: 2,
        subtotal: 160,
        product: expect.objectContaining({
          id: testProduct.id,
          name: testProduct.name,
          slug: testProduct.slug,
          thumbnail: testProduct.thumbnail,
          stock: testProduct.stock,
          isAvailable: testProduct.isAvailable,
          unit: testProduct.unit,
          price: testProduct.price,
          salePrice: testProduct.salePrice
        })
      });
    });

    test('should only return current user\'s cart', async () => {
      // Create cart for test user
      const userCart = await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 160,
        },
      });

      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: testProduct.id,
          quantity: 2,
          subtotal: 160,
        },
      });

      // Create cart for another user
      const anotherUserCart = await prisma.cart.create({
        data: {
          userId: anotherUser.id,
          totalAmount: 150,
        },
      });

      await prisma.cartItem.create({
        data: {
          cartId: anotherUserCart.id,
          productId: anotherProduct.id,
          quantity: 1,
          subtotal: 150,
        },
      });

      // Test user should only see their cart
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.cart.userId).toBe(testUser.id);
      expect(response.body.data.itemsCount).toBe(1);

      // Another user should only see their cart
      const anotherResponse = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${anotherUserToken}`);

      expect(anotherResponse.status).toBe(200);
      expect(anotherResponse.body.data.cart.userId).toBe(anotherUser.id);
      expect(anotherResponse.body.data.itemsCount).toBe(1);
    });

    test('should detect and report stock issues', async () => {
      // Create cart with item
      const cart = await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 160,
        },
      });

      // Add item with quantity exceeding current stock
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: testProduct.id,
          quantity: 100, // Exceeds stock of 50
          subtotal: 8000,
        },
      });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.hasStockIssues).toBe(true);
      expect(response.body.data.stockIssues).toBeDefined();
      expect(response.body.data.stockIssues.length).toBeGreaterThan(0);
      expect(response.body.data.cart.items[0].hasStockIssue).toBe(true);
      expect(response.body.data.cart.items[0].stockAvailable).toBe(testProduct.stock);
    });

    test('should detect unavailable products', async () => {
      // Make product unavailable
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { isAvailable: false }
      });

      // Create cart with unavailable product
      const cart = await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 160,
        },
      });

      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: testProduct.id,
          quantity: 2,
          subtotal: 160,
        },
      });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.hasStockIssues).toBe(true);
      expect(response.body.data.stockIssues[0]).toMatchObject({
        productId: testProduct.id,
        productName: testProduct.name,
        issue: 'Product is no longer available'
      });

      // Reset product availability
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { isAvailable: true }
      });
    });

    test('should recalculate total if prices changed', async () => {
      // Create cart with item
      const cart = await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 160, // Old total
        },
      });

      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: testProduct.id,
          quantity: 2,
          subtotal: 160, // Old subtotal based on sale price 80
        },
      });

      // Change product price
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { salePrice: 90 } // Increased from 80 to 90
      });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.totalAmount).toBe(180); // 2 * 90 = 180
      expect(response.body.data.needsRecalculation).toBe(true);

      // Reset product price
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { salePrice: 80 }
      });
    });

    test('should return empty cart when cart exists but has no items', async () => {
      // Create empty cart
      await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 0,
        },
      });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cart).toBeTruthy();
      expect(response.body.data.itemsCount).toBe(0);
      expect(response.body.data.totalAmount).toBe(0);
      expect(response.body.data.isEmpty).toBe(true);
    });

    test('should sort cart items by creation date descending', async () => {
      // Create cart
      const cart = await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 310,
        },
      });

      // Create items with specific timestamps
      const firstItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: testProduct.id,
          quantity: 2,
          subtotal: 160,
          createdAt: new Date('2024-01-01T10:00:00Z')
        },
      });

      const secondItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: anotherProduct.id,
          quantity: 1,
          subtotal: 150,
          createdAt: new Date('2024-01-01T11:00:00Z')
        },
      });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.cart.items).toHaveLength(2);
      // Should be sorted by creation date descending (newest first)
      expect(response.body.data.cart.items[0].id).toBe(secondItem.id);
      expect(response.body.data.cart.items[1].id).toBe(firstItem.id);
    });

    test('should include cart metadata', async () => {
      // Create cart with item
      const cart = await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 160,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        },
      });

      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: testProduct.id,
          quantity: 2,
          subtotal: 160,
        },
      });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.cart).toMatchObject({
        id: cart.id,
        userId: testUser.id,
        totalAmount: expect.any(Number),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        expiresAt: expect.any(String)
      });
    });

    test('should handle multiple stock issues correctly', async () => {
      // Create unavailable product
      const unavailableProduct = await prisma.product.create({
        data: {
          name: 'Unavailable Product',
          description: 'Test unavailable product',
          price: 200,
          categoryId: testCategory.id,
          thumbnail: 'unavailable.jpg',
          sku: 'UNAVAIL001',
          unit: 'kg',
          stock: 10,
          isAvailable: false,
          slug: 'unavailable-product',
          createdById: testUser.id,
        },
      });

      // Create cart with multiple problematic items
      const cart = await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 500,
        },
      });

      // Item with stock issue
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: testProduct.id,
          quantity: 100, // Exceeds stock
          subtotal: 8000,
        },
      });

      // Unavailable item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: unavailableProduct.id,
          quantity: 1,
          subtotal: 200,
        },
      });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.hasStockIssues).toBe(true);
      expect(response.body.data.stockIssues).toHaveLength(2);
    });
  });
});

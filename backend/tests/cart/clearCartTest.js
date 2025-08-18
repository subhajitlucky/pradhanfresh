const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Cart - Clear Cart Tests', () => {
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

  describe('DELETE /api/cart', () => {
    test('should clear cart with multiple items successfully', async () => {
      // Create cart with multiple items
      const cart = await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 310,
        },
      });

      const item1 = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: testProduct.id,
          quantity: 2,
          subtotal: 160,
        },
      });

      const item2 = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: anotherProduct.id,
          quantity: 1,
          subtotal: 150,
        },
      });

      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cart cleared successfully. 2 items removed.');
      expect(response.body.data.cart.totalAmount).toBe(0);
      expect(response.body.data.itemsCount).toBe(0);
      expect(response.body.data.isEmpty).toBe(true);
      expect(response.body.data.clearedItemsCount).toBe(2);
      expect(response.body.data.clearedItems).toHaveLength(2);

      // Verify items were removed from database
      const remainingItems = await prisma.cartItem.findMany({
        where: { cartId: cart.id }
      });
      expect(remainingItems).toHaveLength(0);

      // Verify cart total was updated
      const updatedCart = await prisma.cart.findUnique({
        where: { id: cart.id }
      });
      expect(updatedCart.totalAmount).toBe(0);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .delete('/api/cart');

      expect(response.status).toBe(401);
    });

    test('should handle user with no cart', async () => {
      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cart is already empty');
      expect(response.body.data).toMatchObject({
        itemsCount: 0,
        totalAmount: 0,
        isEmpty: true
      });
    });

    test('should handle cart with no items', async () => {
      // Create empty cart
      await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 0,
        },
      });

      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cart is already empty');
      expect(response.body.data).toMatchObject({
        itemsCount: 0,
        totalAmount: 0,
        isEmpty: true
      });
    });

    test('should clear only current user\'s cart', async () => {
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

      const anotherUserItem = await prisma.cartItem.create({
        data: {
          cartId: anotherUserCart.id,
          productId: anotherProduct.id,
          quantity: 1,
          subtotal: 150,
        },
      });

      // Clear test user's cart
      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify test user's cart is empty
      const userCartItems = await prisma.cartItem.findMany({
        where: { cartId: userCart.id }
      });
      expect(userCartItems).toHaveLength(0);

      // Verify another user's cart is unaffected
      const anotherUserCartItems = await prisma.cartItem.findMany({
        where: { cartId: anotherUserCart.id }
      });
      expect(anotherUserCartItems).toHaveLength(1);
      expect(anotherUserCartItems[0].id).toBe(anotherUserItem.id);
    });

    test('should include detailed information about cleared items', async () => {
      // Create cart with items
      const cart = await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 310,
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

      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: anotherProduct.id,
          quantity: 1,
          subtotal: 150,
        },
      });

      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.clearedItems).toHaveLength(2);
      
      const clearedItems = response.body.data.clearedItems;
      expect(clearedItems[0]).toMatchObject({
        id: expect.any(Number),
        productName: expect.any(String),
        quantity: expect.any(Number),
        subtotal: expect.any(Number)
      });
      
      expect(clearedItems[1]).toMatchObject({
        id: expect.any(Number),
        productName: expect.any(String),
        quantity: expect.any(Number),
        subtotal: expect.any(Number)
      });
    });

    test('should update cart timestamp after clearing', async () => {
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

      const originalCart = await prisma.cart.findUnique({
        where: { id: cart.id }
      });

      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay

      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);

      const updatedCart = await prisma.cart.findUnique({
        where: { id: cart.id }
      });
      expect(updatedCart.updatedAt.getTime()).toBeGreaterThan(originalCart.updatedAt.getTime());
    });

    test('should return complete cart data after clearing', async () => {
      // Create cart with items
      const cart = await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 160,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
        .delete('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.cart).toMatchObject({
        id: cart.id,
        userId: testUser.id,
        items: [],
        totalAmount: 0,
        itemsCount: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        expiresAt: expect.any(String)
      });
    });

    test('should handle cart with single item', async () => {
      // Create cart with single item
      const cart = await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 80,
        },
      });

      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: testProduct.id,
          quantity: 1,
          subtotal: 80,
        },
      });

      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cart cleared successfully. 1 item removed.');
      expect(response.body.data.clearedItemsCount).toBe(1);
    });

    test('should preserve cart ID and metadata after clearing', async () => {
      // Create cart with items
      const originalExpiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const cart = await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 160,
          expiresAt: originalExpiryTime,
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
        .delete('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);

      // Verify cart still exists with same ID
      const clearedCart = await prisma.cart.findUnique({
        where: { id: cart.id }
      });
      expect(clearedCart).toBeTruthy();
      expect(clearedCart.id).toBe(cart.id);
      expect(clearedCart.userId).toBe(testUser.id);
      expect(clearedCart.totalAmount).toBe(0);
      expect(clearedCart.expiresAt.getTime()).toBe(originalExpiryTime.getTime());
    });

    test('should handle large cart with many items', async () => {
      // Create cart with multiple items
      const cart = await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 800, // 5 * 160
        },
      });

      // Add 5 items
      for (let i = 0; i < 5; i++) {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: testProduct.id,
            quantity: 2,
            subtotal: 160,
          },
        });
      }

      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cart cleared successfully. 5 items removed.');
      expect(response.body.data.clearedItemsCount).toBe(5);
      expect(response.body.data.clearedItems).toHaveLength(5);
    });

    test('should handle concurrent clear requests', async () => {
      // Create cart with items
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

      // Make concurrent requests
      const request1 = request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      const request2 = request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      const [response1, response2] = await Promise.all([request1, request2]);

      // Both should succeed (one will clear, other will find already empty)
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // At least one should show items were cleared
      const responses = [response1, response2];
      const clearResponses = responses.filter(r => 
        r.body.message.includes('items removed')
      );
      const alreadyEmptyResponses = responses.filter(r => 
        r.body.message.includes('already empty')
      );

      expect(clearResponses.length).toBe(1);
      expect(alreadyEmptyResponses.length).toBe(1);
    });

    test('should include correct pluralization in message', async () => {
      // Test single item
      const singleItemCart = await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 80,
        },
      });

      await prisma.cartItem.create({
        data: {
          cartId: singleItemCart.id,
          productId: testProduct.id,
          quantity: 1,
          subtotal: 80,
        },
      });

      const singleResponse = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(singleResponse.status).toBe(200);
      expect(singleResponse.body.message).toBe('Cart cleared successfully. 1 item removed.');

      // Clean up for next test
      await prisma.cartItem.deleteMany({});

      // Test multiple items
      const multiItemCart = await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 310,
        },
      });

      await prisma.cartItem.create({
        data: {
          cartId: multiItemCart.id,
          productId: testProduct.id,
          quantity: 2,
          subtotal: 160,
        },
      });

      await prisma.cartItem.create({
        data: {
          cartId: multiItemCart.id,
          productId: anotherProduct.id,
          quantity: 1,
          subtotal: 150,
        },
      });

      const multiResponse = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(multiResponse.status).toBe(200);
      expect(multiResponse.body.message).toBe('Cart cleared successfully. 2 items removed.');
    });
  });
});

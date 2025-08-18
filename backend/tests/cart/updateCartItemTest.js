const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Cart - Update Cart Item Tests', () => {
  let testUser;
  let anotherUser;
  let userToken;
  let anotherUserToken;
  let testCategory;
  let testProduct;
  let testCart;
  let testCartItem;
  let anotherUserCart;
  let anotherUserCartItem;

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

    // Create test product
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
  });

  beforeEach(async () => {
    // Create test cart and cart item for each test
    testCart = await prisma.cart.create({
      data: {
        userId: testUser.id,
        totalAmount: 160,
      },
    });

    testCartItem = await prisma.cartItem.create({
      data: {
        cartId: testCart.id,
        productId: testProduct.id,
        quantity: 2,
        subtotal: 160,
      },
    });

    // Create cart for another user
    anotherUserCart = await prisma.cart.create({
      data: {
        userId: anotherUser.id,
        totalAmount: 80,
      },
    });

    anotherUserCartItem = await prisma.cartItem.create({
      data: {
        cartId: anotherUserCart.id,
        productId: testProduct.id,
        quantity: 1,
        subtotal: 80,
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
    await prisma.product.delete({
      where: { id: testProduct.id }
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

  describe('PUT /api/cart/:itemId', () => {
    test('should update cart item quantity successfully', async () => {
      const response = await request(app)
        .put(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 5 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated successfully');
      expect(response.body.data.updatedItem.quantity).toBe(5);
      expect(response.body.data.updatedItem.subtotal).toBe(400); // 5 * 80
      expect(response.body.data.cart.totalAmount).toBe(400);

      // Verify in database
      const updatedItem = await prisma.cartItem.findUnique({
        where: { id: testCartItem.id }
      });
      expect(updatedItem.quantity).toBe(5);
      expect(updatedItem.subtotal).toBe(400);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/cart/${testCartItem.id}`)
        .send({ quantity: 3 });

      expect(response.status).toBe(401);
    });

    test('should fail with invalid cart item ID', async () => {
      const response = await request(app)
        .put('/api/cart/invalid-id')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid cart item ID');
    });

    test('should fail with non-existent cart item ID', async () => {
      const response = await request(app)
        .put('/api/cart/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3 });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cart item not found');
    });

    test('should fail when trying to update another user\'s cart item', async () => {
      const response = await request(app)
        .put(`/api/cart/${anotherUserCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3 });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied: This cart item does not belong to you');
    });

    test('should fail with missing quantity', async () => {
      const response = await request(app)
        .put(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Quantity must be a positive number');
    });

    test('should fail with invalid quantity (zero)', async () => {
      const response = await request(app)
        .put(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 0 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Quantity must be a positive number');
    });

    test('should fail with invalid quantity (negative)', async () => {
      const response = await request(app)
        .put(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: -1 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Quantity must be a positive number');
    });

    test('should fail with quantity exceeding maximum limit', async () => {
      const response = await request(app)
        .put(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 100 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Maximum quantity per item is 99');
    });

    test('should fail when quantity exceeds available stock', async () => {
      const response = await request(app)
        .put(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 60 }); // Exceeds stock of 50

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Stock Error');
    });

    test('should update to maximum available stock', async () => {
      const response = await request(app)
        .put(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 50 }); // Maximum available stock

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.updatedItem.quantity).toBe(50);
    });

    test('should calculate correct subtotal with sale price', async () => {
      const response = await request(app)
        .put(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3 });

      expect(response.status).toBe(200);
      // Should use sale price (80) instead of regular price (100)
      expect(response.body.data.updatedItem.subtotal).toBe(240); // 3 * 80
    });

    test('should recalculate cart total after update', async () => {
      // Add another item to cart first
      const anotherCartItem = await prisma.cartItem.create({
        data: {
          cartId: testCart.id,
          productId: testProduct.id,
          quantity: 1,
          subtotal: 80,
        },
      });

      // Update cart total
      await prisma.cart.update({
        where: { id: testCart.id },
        data: { totalAmount: 240 } // 160 + 80
      });

      // Update first item quantity
      const response = await request(app)
        .put(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 1 }); // Reduce from 2 to 1

      expect(response.status).toBe(200);
      expect(response.body.data.cart.totalAmount).toBe(160); // 80 + 80
    });

    test('should include complete updated cart data', async () => {
      const response = await request(app)
        .put(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3 });

      expect(response.status).toBe(200);
      expect(response.body.data.updatedItem).toMatchObject({
        id: testCartItem.id,
        quantity: 3,
        subtotal: 240,
        product: expect.objectContaining({
          id: testProduct.id,
          name: testProduct.name,
          price: testProduct.price,
          salePrice: testProduct.salePrice,
          thumbnail: testProduct.thumbnail,
          unit: testProduct.unit,
          stock: testProduct.stock,
          isAvailable: true
        })
      });

      expect(response.body.data.cart).toMatchObject({
        id: testCart.id,
        userId: testUser.id,
        totalAmount: 240,
        items: expect.any(Array),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });

    test('should handle string quantity input', async () => {
      const response = await request(app)
        .put(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: '4' }); // String instead of number

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.updatedItem.quantity).toBe(4);
    });

    test('should fail with non-numeric quantity', async () => {
      const response = await request(app)
        .put(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Quantity must be a positive number');
    });

    test('should handle decimal quantity by converting to integer', async () => {
      const response = await request(app)
        .put(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3.7 });

      expect(response.status).toBe(200);
      expect(response.body.data.updatedItem.quantity).toBe(3); // parseInt(3.7) = 3
    });

    test('should update cart timestamp', async () => {
      const originalCart = await prisma.cart.findUnique({
        where: { id: testCart.id }
      });

      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay

      const response = await request(app)
        .put(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3 });

      expect(response.status).toBe(200);

      const updatedCart = await prisma.cart.findUnique({
        where: { id: testCart.id }
      });
      expect(updatedCart.updatedAt.getTime()).toBeGreaterThan(originalCart.updatedAt.getTime());
    });

    test('should handle product that becomes unavailable', async () => {
      // Make product unavailable
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { isAvailable: false }
      });

      const response = await request(app)
        .put(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Stock Error');

      // Reset product availability
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { isAvailable: true }
      });
    });

    test('should handle zero cart item ID', async () => {
      const response = await request(app)
        .put('/api/cart/0')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid cart item ID');
    });

    test('should handle negative cart item ID', async () => {
      const response = await request(app)
        .put('/api/cart/-1')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid cart item ID');
    });

    test('should include stock availability information', async () => {
      const response = await request(app)
        .put(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3 });

      expect(response.status).toBe(200);
      expect(response.body.data.availableStock).toBe(testProduct.stock);
      expect(response.body.data.maxQuantityAllowed).toBe(testProduct.stock);
    });

    test('should maintain cart expiry time', async () => {
      // Set expiry time
      const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await prisma.cart.update({
        where: { id: testCart.id },
        data: { expiresAt: expiryTime }
      });

      const response = await request(app)
        .put(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3 });

      expect(response.status).toBe(200);
      
      const updatedCart = await prisma.cart.findUnique({
        where: { id: testCart.id }
      });
      expect(updatedCart.expiresAt.getTime()).toBe(expiryTime.getTime());
    });
  });
});

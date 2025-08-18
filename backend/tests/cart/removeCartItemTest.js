const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Cart - Remove Cart Item Tests', () => {
  let testUser;
  let anotherUser;
  let userToken;
  let anotherUserToken;
  let testCategory;
  let testProduct;
  let anotherProduct;
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

  beforeEach(async () => {
    // Create test cart and cart items for each test
    testCart = await prisma.cart.create({
      data: {
        userId: testUser.id,
        totalAmount: 310, // 160 + 150
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

    // Add another item to test cart
    await prisma.cartItem.create({
      data: {
        cartId: testCart.id,
        productId: anotherProduct.id,
        quantity: 1,
        subtotal: 150,
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

  describe('DELETE /api/cart/:itemId', () => {
    test('should remove cart item successfully', async () => {
      const response = await request(app)
        .delete(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed from cart successfully');
      expect(response.body.data.removedItem).toMatchObject({
        id: testCartItem.id,
        productId: testProduct.id,
        productName: testProduct.name
      });
      expect(response.body.data.cart.totalAmount).toBe(150); // Only remaining item
      expect(response.body.data.itemsCount).toBe(1);
      expect(response.body.data.isEmpty).toBe(false);

      // Verify item was removed from database
      const removedItem = await prisma.cartItem.findUnique({
        where: { id: testCartItem.id }
      });
      expect(removedItem).toBeNull();
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/cart/${testCartItem.id}`);

      expect(response.status).toBe(401);
    });

    test('should fail with invalid cart item ID', async () => {
      const response = await request(app)
        .delete('/api/cart/invalid-id')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid cart item ID');
    });

    test('should fail with non-existent cart item ID', async () => {
      const response = await request(app)
        .delete('/api/cart/99999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cart item not found');
    });

    test('should fail when trying to remove another user\'s cart item', async () => {
      const response = await request(app)
        .delete(`/api/cart/${anotherUserCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied: This cart item does not belong to you');
    });

    test('should recalculate cart total after item removal', async () => {
      const response = await request(app)
        .delete(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.cart.totalAmount).toBe(150); // Only anotherProduct remaining

      // Verify in database
      const updatedCart = await prisma.cart.findUnique({
        where: { id: testCart.id }
      });
      expect(updatedCart.totalAmount).toBe(150);
    });

    test('should return updated cart with remaining items', async () => {
      const response = await request(app)
        .delete(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.cart).toBeDefined();
      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.items[0].productId).toBe(anotherProduct.id);
      expect(response.body.data.cart.items[0]).toMatchObject({
        product: expect.objectContaining({
          id: anotherProduct.id,
          name: anotherProduct.name,
          slug: anotherProduct.slug,
          thumbnail: anotherProduct.thumbnail,
          stock: anotherProduct.stock,
          isAvailable: anotherProduct.isAvailable,
          unit: anotherProduct.unit,
          price: anotherProduct.price
        })
      });
    });

    test('should set isEmpty to true when removing last item', async () => {
      // Remove the second item first
      const secondItem = await prisma.cartItem.findFirst({
        where: { 
          cartId: testCart.id,
          productId: anotherProduct.id
        }
      });

      await request(app)
        .delete(`/api/cart/${secondItem.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      // Now remove the last item
      const response = await request(app)
        .delete(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.isEmpty).toBe(true);
      expect(response.body.data.itemsCount).toBe(0);
      expect(response.body.data.cart.totalAmount).toBe(0);
    });

    test('should handle zero cart item ID', async () => {
      const response = await request(app)
        .delete('/api/cart/0')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid cart item ID');
    });

    test('should handle negative cart item ID', async () => {
      const response = await request(app)
        .delete('/api/cart/-1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid cart item ID');
    });

    test('should update cart timestamp after removal', async () => {
      const originalCart = await prisma.cart.findUnique({
        where: { id: testCart.id }
      });

      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay

      const response = await request(app)
        .delete(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);

      const updatedCart = await prisma.cart.findUnique({
        where: { id: testCart.id }
      });
      expect(updatedCart.updatedAt.getTime()).toBeGreaterThan(originalCart.updatedAt.getTime());
    });

    test('should include complete removed item information', async () => {
      const response = await request(app)
        .delete(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.removedItem).toEqual({
        id: testCartItem.id,
        productId: testProduct.id,
        productName: testProduct.name
      });
    });

    test('should maintain other cart items unchanged', async () => {
      const otherItem = await prisma.cartItem.findFirst({
        where: { 
          cartId: testCart.id,
          productId: anotherProduct.id
        }
      });

      const response = await request(app)
        .delete(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);

      // Verify other item remains unchanged
      const remainingItem = await prisma.cartItem.findUnique({
        where: { id: otherItem.id }
      });
      expect(remainingItem).toBeTruthy();
      expect(remainingItem.quantity).toBe(otherItem.quantity);
      expect(remainingItem.subtotal).toBe(otherItem.subtotal);
    });

    test('should handle removal when cart has single item', async () => {
      // Create a cart with single item
      const singleItemCart = await prisma.cart.create({
        data: {
          userId: testUser.id,
          totalAmount: 80,
        },
      });

      const singleItem = await prisma.cartItem.create({
        data: {
          cartId: singleItemCart.id,
          productId: testProduct.id,
          quantity: 1,
          subtotal: 80,
        },
      });

      const response = await request(app)
        .delete(`/api/cart/${singleItem.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.isEmpty).toBe(true);
      expect(response.body.data.itemsCount).toBe(0);
      expect(response.body.data.cart.items).toHaveLength(0);
      expect(response.body.data.cart.totalAmount).toBe(0);
    });

    test('should verify item belongs to correct cart', async () => {
      // This test ensures the ownership verification works through cart relationship
      const response = await request(app)
        .delete(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify another user's item is still intact
      const anotherUserItem = await prisma.cartItem.findUnique({
        where: { id: anotherUserCartItem.id }
      });
      expect(anotherUserItem).toBeTruthy();
    });

    test('should handle string cart item ID', async () => {
      const response = await request(app)
        .delete(`/api/cart/${testCartItem.id.toString()}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should handle decimal cart item ID by parsing to integer', async () => {
      const response = await request(app)
        .delete(`/api/cart/${testCartItem.id}.5`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should include cart metadata in response', async () => {
      const response = await request(app)
        .delete(`/api/cart/${testCartItem.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.cart).toMatchObject({
        id: testCart.id,
        userId: testUser.id,
        totalAmount: expect.any(Number),
        items: expect.any(Array),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });
  });
});

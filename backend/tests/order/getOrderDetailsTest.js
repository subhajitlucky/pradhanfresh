const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Order - Get Order Details Tests', () => {
  let testUser;
  let anotherUser;
  let userToken;
  let anotherUserToken;
  let testCategory;
  let testProduct;
  let testOrder;
  let anotherUserOrder;

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

    // Create test category and product
    testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        description: 'Test category for orders',
      },
    });

    testProduct = await prisma.product.create({
      data: {
        name: 'Test Product',
        description: 'Test product for order details',
        price: 100,
        categoryId: testCategory.id,
        thumbnail: 'test-product.jpg',
        sku: 'TEST001',
        unit: 'kg',
        stock: 100,
        slug: 'test-product',
        createdById: testUser.id,
      },
    });

    // Create test orders
    testOrder = await prisma.order.create({
      data: {
        orderNumber: 'PF-2024-000001',
        status: 'SHIPPED',
        totalAmount: 250,
        subtotal: 200,
        deliveryFee: 30,
        tax: 20,
        discount: 0,
        deliveryAddress: JSON.stringify({
          fullName: 'Test User',
          phone: '9876543210',
          addressLine1: '123 Main Street',
          addressLine2: 'Apt 4B',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          landmark: 'Near Central Mall'
        }),
        paymentMethod: 'COD',
        orderNotes: 'Handle with care',
        deliveryDate: new Date('2024-12-25'),
        deliverySlot: 'MORNING',
        userId: testUser.id,
      },
    });

    anotherUserOrder = await prisma.order.create({
      data: {
        orderNumber: 'PF-2024-000002',
        status: 'PENDING',
        totalAmount: 150,
        subtotal: 120,
        deliveryFee: 30,
        tax: 0,
        discount: 0,
        deliveryAddress: JSON.stringify({
          fullName: 'Another User',
          phone: '9876543210',
          addressLine1: '456 Another Street',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001'
        }),
        paymentMethod: 'ONLINE',
        userId: anotherUser.id,
      },
    });

    // Create order items
    await prisma.orderItem.create({
      data: {
        orderId: testOrder.id,
        productId: testProduct.id,
        quantity: 2,
        price: testProduct.price,
        subtotal: 200,
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: anotherUserOrder.id,
        productId: testProduct.id,
        quantity: 1,
        price: testProduct.price,
        subtotal: 100,
      },
    });

    // Create status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: testOrder.id,
        oldStatus: 'CONFIRMED',
        newStatus: 'SHIPPED',
        notes: 'Order shipped via courier',
        changedByUserId: testUser.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.orderStatusHistory.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
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

  describe('GET /api/orders/:orderNumber', () => {
    test('should get order details successfully', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder.orderNumber}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Order details retrieved successfully');
      expect(response.body.data).toMatchObject({
        id: testOrder.id,
        orderNumber: testOrder.orderNumber,
        status: testOrder.status,
        totalAmount: testOrder.totalAmount,
        subtotal: testOrder.subtotal,
        deliveryFee: testOrder.deliveryFee,
        tax: testOrder.tax,
        discount: testOrder.discount,
        paymentMethod: testOrder.paymentMethod,
        orderNotes: testOrder.orderNotes,
        deliverySlot: testOrder.deliverySlot,
      });
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder.orderNumber}`);

      expect(response.status).toBe(401);
    });

    test('should fail when accessing another user\'s order', async () => {
      const response = await request(app)
        .get(`/api/orders/${anotherUserOrder.orderNumber}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found or access denied');
    });

    test('should fail with non-existent order number', async () => {
      const response = await request(app)
        .get('/api/orders/PF-2024-999999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found or access denied');
    });

    test('should fail with empty order number', async () => {
      const response = await request(app)
        .get('/api/orders/')
        .set('Authorization', `Bearer ${userToken}`);

      // This would hit the GET /api/orders route instead
      expect(response.status).toBe(200); // Different endpoint
    });

    test('should include order items with product details', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder.orderNumber}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.items).toBeDefined();
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items.length).toBe(1);
      
      const item = response.body.data.items[0];
      expect(item).toMatchObject({
        quantity: 2,
        price: testProduct.price,
        subtotal: 200,
        product: expect.objectContaining({
          id: testProduct.id,
          name: testProduct.name,
          thumbnail: testProduct.thumbnail,
          unit: testProduct.unit,
        })
      });
    });

    test('should include user information', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder.orderNumber}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user).toMatchObject({
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
      });
    });

    test('should include status history', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder.orderNumber}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.statusHistory).toBeDefined();
      expect(Array.isArray(response.body.data.statusHistory)).toBe(true);
      expect(response.body.data.statusHistory.length).toBeGreaterThan(0);
      
      const historyEntry = response.body.data.statusHistory[0];
      expect(historyEntry).toMatchObject({
        oldStatus: 'CONFIRMED',
        newStatus: 'SHIPPED',
        notes: 'Order shipped via courier',
      });
    });

    test('should include enhanced status information', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder.orderNumber}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.statusInfo).toBeDefined();
      expect(response.body.data.statusInfo).toMatchObject({
        label: expect.any(String),
        description: expect.any(String),
        color: expect.any(String),
        canCancel: expect.any(Boolean),
      });
    });

    test('should include parsed delivery address', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder.orderNumber}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.deliveryAddress).toBeDefined();
      expect(typeof response.body.data.deliveryAddress).toBe('object');
      expect(response.body.data.deliveryAddress).toMatchObject({
        fullName: 'Test User',
        phone: '9876543210',
        addressLine1: '123 Main Street',
        addressLine2: 'Apt 4B',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        landmark: 'Near Central Mall',
      });
    });

    test('should include order summary', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder.orderNumber}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.orderSummary).toBeDefined();
      expect(response.body.data.orderSummary).toMatchObject({
        itemsCount: 1,
        totalItems: 2, // Quantity of items
        subtotal: testOrder.subtotal,
        deliveryFee: testOrder.deliveryFee,
        tax: testOrder.tax,
        discount: testOrder.discount,
        totalAmount: testOrder.totalAmount,
      });
    });

    test('should include action availability flags', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder.orderNumber}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.canCancel).toBeDefined();
      expect(response.body.data.canReturn).toBeDefined();
      expect(typeof response.body.data.canCancel).toBe('boolean');
      expect(typeof response.body.data.canReturn).toBe('boolean');
      
      // SHIPPED order should not be cancellable but not returnable
      expect(response.body.data.canCancel).toBe(false);
      expect(response.body.data.canReturn).toBe(false);
    });

    test('should include estimated delivery date', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder.orderNumber}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.estimatedDelivery).toBeDefined();
      expect(response.body.data.estimatedDelivery).toBe('2024-12-25');
    });

    test('should handle order with pending status (can cancel)', async () => {
      // Create a pending order
      const pendingOrder = await prisma.order.create({
        data: {
          orderNumber: 'PF-2024-000003',
          status: 'PENDING',
          totalAmount: 100,
          subtotal: 80,
          deliveryFee: 20,
          tax: 0,
          discount: 0,
          deliveryAddress: JSON.stringify({
            fullName: 'Test User',
            phone: '9876543210',
            addressLine1: '789 Test Street',
            city: 'Pune',
            state: 'Maharashtra',
            pincode: '411001'
          }),
          paymentMethod: 'COD',
          userId: testUser.id,
        },
      });

      const response = await request(app)
        .get(`/api/orders/${pendingOrder.orderNumber}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.canCancel).toBe(true);
      expect(response.body.data.canReturn).toBe(false);

      // Clean up
      await prisma.order.delete({
        where: { id: pendingOrder.id }
      });
    });

    test('should handle order with delivered status (can return)', async () => {
      // Create a delivered order
      const deliveredOrder = await prisma.order.create({
        data: {
          orderNumber: 'PF-2024-000004',
          status: 'DELIVERED',
          totalAmount: 100,
          subtotal: 80,
          deliveryFee: 20,
          tax: 0,
          discount: 0,
          deliveryAddress: JSON.stringify({
            fullName: 'Test User',
            phone: '9876543210',
            addressLine1: '789 Test Street',
            city: 'Pune',
            state: 'Maharashtra',
            pincode: '411001'
          }),
          paymentMethod: 'COD',
          userId: testUser.id,
        },
      });

      const response = await request(app)
        .get(`/api/orders/${deliveredOrder.orderNumber}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.canCancel).toBe(false);
      expect(response.body.data.canReturn).toBe(true);

      // Clean up
      await prisma.order.delete({
        where: { id: deliveredOrder.id }
      });
    });

    test('should handle order without delivery date', async () => {
      const response = await request(app)
        .get(`/api/orders/${anotherUserOrder.orderNumber}`)
        .set('Authorization', `Bearer ${anotherUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.estimatedDelivery).toBeNull();
    });

    test('should handle invalid order number format', async () => {
      const response = await request(app)
        .get('/api/orders/invalid-format')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});

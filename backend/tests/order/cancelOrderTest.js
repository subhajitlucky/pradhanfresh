const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Order - Cancel Order Tests', () => {
  let testUser;
  let anotherUser;
  let userToken;
  let anotherUserToken;
  let testCategory;
  let testProduct;

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
        description: 'Test product for order cancellation',
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

  describe('PUT /api/orders/:orderNumber/cancel', () => {
    let pendingOrder;
    let confirmedOrder;
    let processingOrder;
    let shippedOrder;
    let anotherUserOrder;

    beforeEach(async () => {
      // Create orders with different statuses for each test
      pendingOrder = await prisma.order.create({
        data: {
          orderNumber: 'PF-2024-001001',
          status: 'PENDING',
          totalAmount: 200,
          subtotal: 180,
          deliveryFee: 20,
          tax: 0,
          discount: 0,
          deliveryAddress: JSON.stringify({
            fullName: 'Test User',
            phone: '9876543210',
            addressLine1: '123 Main Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          }),
          paymentMethod: 'COD',
          userId: testUser.id,
        },
      });

      confirmedOrder = await prisma.order.create({
        data: {
          orderNumber: 'PF-2024-001002',
          status: 'CONFIRMED',
          totalAmount: 150,
          subtotal: 130,
          deliveryFee: 20,
          tax: 0,
          discount: 0,
          deliveryAddress: JSON.stringify({
            fullName: 'Test User',
            phone: '9876543210',
            addressLine1: '123 Main Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          }),
          paymentMethod: 'ONLINE',
          userId: testUser.id,
        },
      });

      processingOrder = await prisma.order.create({
        data: {
          orderNumber: 'PF-2024-001003',
          status: 'PROCESSING',
          totalAmount: 300,
          subtotal: 280,
          deliveryFee: 20,
          tax: 0,
          discount: 0,
          deliveryAddress: JSON.stringify({
            fullName: 'Test User',
            phone: '9876543210',
            addressLine1: '123 Main Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          }),
          paymentMethod: 'COD',
          userId: testUser.id,
        },
      });

      shippedOrder = await prisma.order.create({
        data: {
          orderNumber: 'PF-2024-001004',
          status: 'SHIPPED',
          totalAmount: 250,
          subtotal: 230,
          deliveryFee: 20,
          tax: 0,
          discount: 0,
          deliveryAddress: JSON.stringify({
            fullName: 'Test User',
            phone: '9876543210',
            addressLine1: '123 Main Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          }),
          paymentMethod: 'COD',
          userId: testUser.id,
        },
      });

      anotherUserOrder = await prisma.order.create({
        data: {
          orderNumber: 'PF-2024-001005',
          status: 'PENDING',
          totalAmount: 100,
          subtotal: 80,
          deliveryFee: 20,
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
          paymentMethod: 'COD',
          userId: anotherUser.id,
        },
      });

      // Create order items with stock reduction simulation
      for (const order of [pendingOrder, confirmedOrder, processingOrder, shippedOrder, anotherUserOrder]) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: testProduct.id,
            quantity: 2,
            price: testProduct.price,
            subtotal: 200,
          },
        });
      }

      // Reduce product stock to simulate order creation
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stock: testProduct.stock - 10 } // 5 orders × 2 quantity each
      });
    });

    afterEach(async () => {
      // Clean up orders after each test
      await prisma.orderStatusHistory.deleteMany({});
      await prisma.orderItem.deleteMany({});
      await prisma.order.deleteMany({});
      
      // Reset product stock
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stock: 100 }
      });
    });

    test('should cancel PENDING order successfully', async () => {
      const response = await request(app)
        .put(`/api/orders/${pendingOrder.orderNumber}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Changed my mind' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('cancelled successfully');
      expect(response.body.data.status).toBe('CANCELLED');
      expect(response.body.data.statusInfo.label).toBe('Cancelled');
      expect(response.body.data.orderSummary.refundAmount).toBe(pendingOrder.totalAmount);

      // Verify order status updated in database
      const updatedOrder = await prisma.order.findUnique({
        where: { id: pendingOrder.id }
      });
      expect(updatedOrder.status).toBe('CANCELLED');
      expect(updatedOrder.cancellationReason).toBe('Changed my mind');
      expect(updatedOrder.cancelledAt).toBeTruthy();
    });

    test('should cancel CONFIRMED order successfully', async () => {
      const response = await request(app)
        .put(`/api/orders/${confirmedOrder.orderNumber}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Found better deal elsewhere' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CANCELLED');
    });

    test('should cancel PROCESSING order successfully', async () => {
      const response = await request(app)
        .put(`/api/orders/${processingOrder.orderNumber}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Emergency cancellation' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CANCELLED');
    });

    test('should fail to cancel SHIPPED order', async () => {
      const response = await request(app)
        .put(`/api/orders/${shippedOrder.orderNumber}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Want to cancel' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('cannot be cancelled');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/orders/${pendingOrder.orderNumber}/cancel`)
        .send({ reason: 'Want to cancel' });

      expect(response.status).toBe(401);
    });

    test('should fail when trying to cancel another user\'s order', async () => {
      const response = await request(app)
        .put(`/api/orders/${anotherUserOrder.orderNumber}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Want to cancel' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found or access denied');
    });

    test('should fail with non-existent order number', async () => {
      const response = await request(app)
        .put('/api/orders/PF-2024-999999/cancel')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Want to cancel' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should fail with empty order number', async () => {
      const response = await request(app)
        .put('/api/orders//cancel')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Want to cancel' });

      expect(response.status).toBe(404); // Route not found
    });

    test('should work without providing cancellation reason', async () => {
      const response = await request(app)
        .put(`/api/orders/${pendingOrder.orderNumber}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify reason is null in database
      const updatedOrder = await prisma.order.findUnique({
        where: { id: pendingOrder.id }
      });
      expect(updatedOrder.cancellationReason).toBeNull();
    });

    test('should restore product stock after cancellation', async () => {
      const originalStock = await prisma.product.findUnique({
        where: { id: testProduct.id },
        select: { stock: true }
      });

      const response = await request(app)
        .put(`/api/orders/${pendingOrder.orderNumber}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Stock restoration test' });

      expect(response.status).toBe(200);

      // Verify stock was restored
      const updatedProduct = await prisma.product.findUnique({
        where: { id: testProduct.id },
        select: { stock: true }
      });
      expect(updatedProduct.stock).toBe(originalStock.stock + 2); // 2 was the quantity
    });

    test('should create cancellation status history', async () => {
      const response = await request(app)
        .put(`/api/orders/${pendingOrder.orderNumber}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Status history test' });

      expect(response.status).toBe(200);

      // Verify status history was created
      const statusHistory = await prisma.orderStatusHistory.findFirst({
        where: { orderId: pendingOrder.id },
        orderBy: { changedAt: 'desc' }
      });
      expect(statusHistory).toBeTruthy();
      expect(statusHistory.oldStatus).toBe('PENDING');
      expect(statusHistory.newStatus).toBe('CANCELLED');
      expect(statusHistory.notes).toContain('Status history test');
      expect(statusHistory.changedByUserId).toBe(testUser.id);
    });

    test('should include complete order data in response', async () => {
      const response = await request(app)
        .put(`/api/orders/${pendingOrder.orderNumber}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Complete data test' });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        id: pendingOrder.id,
        orderNumber: pendingOrder.orderNumber,
        status: 'CANCELLED',
        totalAmount: pendingOrder.totalAmount,
        items: expect.any(Array),
        statusInfo: expect.objectContaining({
          label: 'Cancelled',
          canCancel: false
        }),
        deliveryAddress: expect.any(Object),
        orderSummary: expect.objectContaining({
          itemsCount: expect.any(Number),
          totalItems: expect.any(Number),
          refundAmount: pendingOrder.totalAmount
        })
      });
    });

    test('should handle cancellation with long reason text', async () => {
      const longReason = 'This is a very long cancellation reason that contains multiple sentences and explanations about why the customer wants to cancel their order. It should be handled properly by the system without any issues.';
      
      const response = await request(app)
        .put(`/api/orders/${pendingOrder.orderNumber}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: longReason });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const updatedOrder = await prisma.order.findUnique({
        where: { id: pendingOrder.id }
      });
      expect(updatedOrder.cancellationReason).toBe(longReason);
    });

    test('should handle concurrent cancellation attempts', async () => {
      // This test simulates race conditions but might be limited by test setup
      const response1 = request(app)
        .put(`/api/orders/${pendingOrder.orderNumber}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'First attempt' });

      const response2 = request(app)
        .put(`/api/orders/${pendingOrder.orderNumber}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Second attempt' });

      const [result1, result2] = await Promise.all([response1, response2]);

      // One should succeed, one should fail
      const responses = [result1, result2];
      const successfulResponses = responses.filter(r => r.status === 200);
      const failedResponses = responses.filter(r => r.status !== 200);

      expect(successfulResponses.length).toBe(1);
      expect(failedResponses.length).toBe(1);
    });
  });
});

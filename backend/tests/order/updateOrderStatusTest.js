const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Order - Update Order Status Tests', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let userToken;
  let testCategory;
  let testProduct;

  beforeAll(async () => {
    // Create admin user
    const hashedPassword = await bcrypt.hash('adminpassword', 10);
    adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });

    // Create regular user
    regularUser = await prisma.user.create({
      data: {
        name: 'Regular User',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'USER',
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
        description: 'Test product for order status updates',
        price: 100,
        categoryId: testCategory.id,
        thumbnail: 'test-product.jpg',
        sku: 'TEST001',
        unit: 'kg',
        stock: 100,
        slug: 'test-product',
        createdById: adminUser.id,
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
        email: { in: ['admin@example.com', 'user@example.com'] }
      }
    });
    await prisma.$disconnect();
  });

  describe('PUT /api/orders/:orderNumber/status', () => {
    let testOrder;

    beforeEach(async () => {
      // Create a test order for each test
      testOrder = await prisma.order.create({
        data: {
          orderNumber: 'PF-2024-002001',
          status: 'PENDING',
          totalAmount: 200,
          subtotal: 180,
          deliveryFee: 20,
          tax: 0,
          discount: 0,
          deliveryAddress: JSON.stringify({
            fullName: 'Regular User',
            phone: '9876543210',
            addressLine1: '123 Main Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          }),
          paymentMethod: 'COD',
          userId: regularUser.id,
        },
      });

      // Create order item
      await prisma.orderItem.create({
        data: {
          orderId: testOrder.id,
          productId: testProduct.id,
          quantity: 2,
          price: testProduct.price,
          subtotal: 200,
        },
      });
    });

    afterEach(async () => {
      // Clean up order after each test
      await prisma.orderStatusHistory.deleteMany({});
      await prisma.orderItem.deleteMany({});
      await prisma.order.deleteMany({});
    });

    test('should update order status successfully with admin token', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'CONFIRMED',
          adminNotes: 'Order confirmed by admin'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('status updated to CONFIRMED');
      expect(response.body.data.status).toBe('CONFIRMED');
      expect(response.body.data.previousStatus).toBe('PENDING');
      expect(response.body.data.changedBy).toMatchObject({
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email
      });

      // Verify status updated in database
      const updatedOrder = await prisma.order.findUnique({
        where: { id: testOrder.id }
      });
      expect(updatedOrder.status).toBe('CONFIRMED');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .send({
          status: 'CONFIRMED'
        });

      expect(response.status).toBe(401);
    });

    test('should fail with regular user token', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'CONFIRMED'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied: Admin privileges required');
    });

    test('should fail with non-existent order', async () => {
      const response = await request(app)
        .put('/api/orders/PF-2024-999999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'CONFIRMED'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('should fail with empty order number', async () => {
      const response = await request(app)
        .put('/api/orders//status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'CONFIRMED'
        });

      expect(response.status).toBe(404); // Route not found
    });

    test('should fail with missing status', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminNotes: 'Just some notes'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid status', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'INVALID_STATUS'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should follow valid status transitions', async () => {
      // PENDING -> CONFIRMED (valid)
      const response1 = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'CONFIRMED',
          adminNotes: 'Order confirmed'
        });

      expect(response1.status).toBe(200);

      // CONFIRMED -> PROCESSING (valid)
      const response2 = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'PROCESSING',
          adminNotes: 'Processing order'
        });

      expect(response2.status).toBe(200);

      // PROCESSING -> SHIPPED (valid)
      const response3 = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'SHIPPED',
          adminNotes: 'Order shipped'
        });

      expect(response3.status).toBe(200);

      // SHIPPED -> DELIVERED (valid)
      const response4 = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'DELIVERED',
          adminNotes: 'Order delivered'
        });

      expect(response4.status).toBe(200);
    });

    test('should reject invalid status transitions', async () => {
      // PENDING -> SHIPPED (invalid - skipping steps)
      const response = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'SHIPPED',
          adminNotes: 'Trying to skip steps'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid Transition');
    });

    test('should allow cancellation from any valid status', async () => {
      // PENDING -> CANCELLED (valid)
      const response = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'CANCELLED',
          adminNotes: 'Admin cancelled order'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('CANCELLED');
    });

    test('should create status history entry', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'CONFIRMED',
          adminNotes: 'Status history test'
        });

      expect(response.status).toBe(200);

      // Verify status history was created
      const statusHistory = await prisma.orderStatusHistory.findFirst({
        where: { orderId: testOrder.id },
        orderBy: { changedAt: 'desc' }
      });
      expect(statusHistory).toBeTruthy();
      expect(statusHistory.oldStatus).toBe('PENDING');
      expect(statusHistory.newStatus).toBe('CONFIRMED');
      expect(statusHistory.notes).toBe('Status history test');
      expect(statusHistory.changedByUserId).toBe(adminUser.id);
    });

    test('should work without admin notes', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'CONFIRMED'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should include enhanced status information in response', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'SHIPPED',
          adminNotes: 'Order shipped via courier'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.statusInfo).toBeDefined();
      expect(response.body.data.statusInfo).toMatchObject({
        label: expect.any(String),
        description: expect.any(String),
        color: expect.any(String),
        canCancel: expect.any(Boolean)
      });
    });

    test('should include parsed delivery address', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'CONFIRMED'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.deliveryAddress).toBeDefined();
      expect(typeof response.body.data.deliveryAddress).toBe('object');
      expect(response.body.data.deliveryAddress.fullName).toBe('Regular User');
    });

    test('should handle status update for different order statuses', async () => {
      // Test updating from CONFIRMED status
      await prisma.order.update({
        where: { id: testOrder.id },
        data: { status: 'CONFIRMED' }
      });

      const response = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'PROCESSING',
          adminNotes: 'Moving to processing'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('PROCESSING');
      expect(response.body.data.previousStatus).toBe('CONFIRMED');
    });

    test('should handle long admin notes', async () => {
      const longNotes = 'This is a very long admin note that contains detailed information about why the status is being changed. It includes multiple sentences and comprehensive details about the order processing status update.';

      const response = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'CONFIRMED',
          adminNotes: longNotes
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify long notes are stored correctly
      const statusHistory = await prisma.orderStatusHistory.findFirst({
        where: { orderId: testOrder.id },
        orderBy: { changedAt: 'desc' }
      });
      expect(statusHistory.notes).toBe(longNotes);
    });

    test('should prevent updating to same status', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'PENDING', // Same as current status
          adminNotes: 'Trying to set same status'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid Transition');
    });

    test('should handle orders in terminal states', async () => {
      // Set order to DELIVERED status
      await prisma.order.update({
        where: { id: testOrder.id },
        data: { status: 'DELIVERED' }
      });

      // Try to change from DELIVERED to CONFIRMED (invalid)
      const response = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'CONFIRMED',
          adminNotes: 'Trying invalid transition'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should allow DELIVERED to RETURNED transition', async () => {
      // Set order to DELIVERED status first
      await prisma.order.update({
        where: { id: testOrder.id },
        data: { status: 'DELIVERED' }
      });

      const response = await request(app)
        .put(`/api/orders/${testOrder.orderNumber}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'RETURNED',
          adminNotes: 'Customer returned the order'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('RETURNED');
    });
  });
});

const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Order - Get Orders Tests', () => {
  let testUser;
  let anotherUser;
  let userToken;
  let anotherUserToken;
  let testCategory;
  let testProduct;
  let testOrders = [];

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
        description: 'Test product for orders',
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

    // Create test orders with different statuses and dates
    const orderData = [
      {
        orderNumber: 'PF-2024-000001',
        status: 'PENDING',
        totalAmount: 200,
        subtotal: 180,
        deliveryFee: 20,
        tax: 0,
        discount: 0,
        deliveryAddress: JSON.stringify({
          fullName: 'Test User',
          phone: '9876543210',
          addressLine1: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        }),
        paymentMethod: 'COD',
        userId: testUser.id,
        createdAt: new Date('2024-01-15'),
      },
      {
        orderNumber: 'PF-2024-000002',
        status: 'SHIPPED',
        totalAmount: 150,
        subtotal: 130,
        deliveryFee: 20,
        tax: 0,
        discount: 0,
        deliveryAddress: JSON.stringify({
          fullName: 'Test User',
          phone: '9876543210',
          addressLine1: '456 Another St',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001'
        }),
        paymentMethod: 'ONLINE',
        userId: testUser.id,
        createdAt: new Date('2024-01-20'),
      },
      {
        orderNumber: 'PF-2024-000003',
        status: 'DELIVERED',
        totalAmount: 300,
        subtotal: 280,
        deliveryFee: 20,
        tax: 0,
        discount: 0,
        deliveryAddress: JSON.stringify({
          fullName: 'Test User',
          phone: '9876543210',
          addressLine1: '789 Third St',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001'
        }),
        paymentMethod: 'COD',
        userId: testUser.id,
        createdAt: new Date('2024-01-10'),
      },
      {
        orderNumber: 'PF-2024-000004',
        status: 'CANCELLED',
        totalAmount: 100,
        subtotal: 80,
        deliveryFee: 20,
        tax: 0,
        discount: 0,
        deliveryAddress: JSON.stringify({
          fullName: 'Another User',
          phone: '9876543210',
          addressLine1: '999 Other St',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001'
        }),
        paymentMethod: 'COD',
        userId: anotherUser.id, // Different user
        createdAt: new Date('2024-01-12'),
      },
    ];

    for (const data of orderData) {
      const order = await prisma.order.create({ data });
      testOrders.push(order);

      // Create order items
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
  });

  afterAll(async () => {
    // Clean up test data
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

  describe('GET /api/orders', () => {
    test('should get user orders successfully', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Orders retrieved successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.filters).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3); // Only testUser's orders
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/orders');

      expect(response.status).toBe(401);
    });

    test('should only return orders for authenticated user', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach(order => {
        expect(order.userId).toBe(testUser.id);
      });

      // Test with another user
      const anotherResponse = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${anotherUserToken}`);

      expect(anotherResponse.status).toBe(200);
      expect(anotherResponse.body.data.length).toBe(1); // Only their order
      expect(anotherResponse.body.data[0].userId).toBe(anotherUser.id);
    });

    test('should include order items and status info', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      const order = response.body.data[0];
      expect(order.items).toBeDefined();
      expect(Array.isArray(order.items)).toBe(true);
      expect(order.statusInfo).toBeDefined();
      expect(order.statusInfo.label).toBeDefined();
      expect(order.deliveryAddress).toBeDefined();
      expect(typeof order.deliveryAddress).toBe('object');
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.totalOrders).toBe(3);
    });

    test('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ status: 'SHIPPED' })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe('SHIPPED');
    });

    test('should filter orders by date range', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({
          startDate: '2024-01-14',
          endDate: '2024-01-21'
        })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2); // Orders from Jan 15 and Jan 20
    });

    test('should sort orders by creation date descending (default)', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      const orders = response.body.data;
      expect(orders.length).toBeGreaterThan(1);

      // Check if sorted by creation date descending
      for (let i = 1; i < orders.length; i++) {
        const prevDate = new Date(orders[i - 1].createdAt);
        const currDate = new Date(orders[i].createdAt);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });

    test('should sort orders by total amount ascending', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ sortBy: 'totalAmount', sortOrder: 'asc' })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      const orders = response.body.data;
      
      for (let i = 1; i < orders.length; i++) {
        expect(orders[i].totalAmount).toBeGreaterThanOrEqual(orders[i - 1].totalAmount);
      }
    });

    test('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ page: -1, limit: 0 })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should handle invalid sort parameters', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ sortBy: 'invalidField', sortOrder: 'invalidOrder' })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should handle invalid status filter', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ status: 'INVALID_STATUS' })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should handle invalid date format', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ startDate: 'invalid-date' })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return correct pagination metadata', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ limit: 2 })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toMatchObject({
        currentPage: expect.any(Number),
        totalPages: expect.any(Number),
        totalOrders: expect.any(Number),
        limit: expect.any(Number),
        hasNextPage: expect.any(Boolean),
        hasPrevPage: expect.any(Boolean),
      });
    });

    test('should return correct filter metadata', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ status: 'SHIPPED', sortBy: 'createdAt', sortOrder: 'desc' })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.filters.appliedFilters).toMatchObject({
        status: 'SHIPPED',
        dateRange: null,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
    });

    test('should handle empty results', async () => {
      // Filter for a status that doesn't exist for this user
      const response = await request(app)
        .get('/api/orders')
        .query({ status: 'RETURNED' })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.totalOrders).toBe(0);
    });

    test('should handle large page numbers', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ page: 999, limit: 10 })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });

    test('should combine multiple filters', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({
          status: 'PENDING',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          sortBy: 'totalAmount',
          sortOrder: 'desc'
        })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach(order => {
        expect(order.status).toBe('PENDING');
      });
    });
  });
});

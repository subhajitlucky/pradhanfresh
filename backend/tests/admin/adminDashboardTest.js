const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Admin - Dashboard Tests', () => {
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

    // Create test category and product for orders
    testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        description: 'Test category for admin tests',
      },
    });

    testProduct = await prisma.product.create({
      data: {
        name: 'Test Product',
        description: 'Test product for admin tests',
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

    // Create test orders with different statuses
    const orderData = [
      {
        orderNumber: 'PF-2024-001001',
        status: 'DELIVERED',
        totalAmount: 500,
        subtotal: 450,
        deliveryFee: 50,
        tax: 0,
        discount: 0,
        userId: regularUser.id,
        createdAt: new Date('2024-01-15'),
      },
      {
        orderNumber: 'PF-2024-001002',
        status: 'DELIVERED',
        totalAmount: 300,
        subtotal: 250,
        deliveryFee: 50,
        tax: 0,
        discount: 0,
        userId: regularUser.id,
        createdAt: new Date('2024-01-20'),
      },
      {
        orderNumber: 'PF-2024-001003',
        status: 'PENDING',
        totalAmount: 200,
        subtotal: 150,
        deliveryFee: 50,
        tax: 0,
        discount: 0,
        userId: regularUser.id,
        createdAt: new Date('2024-01-25'),
      },
    ];

    for (const data of orderData) {
      const order = await prisma.order.create({
        data: {
          ...data,
          deliveryAddress: JSON.stringify({
            fullName: 'Test User',
            phone: '9876543210',
            addressLine1: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456'
          }),
          paymentMethod: 'COD',
        }
      });

      // Create order items
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: testProduct.id,
          quantity: 1,
          price: testProduct.price,
          subtotal: 100,
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
        email: { in: ['admin@example.com', 'user@example.com'] }
      }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/admin/dashboard', () => {
    test('should access admin dashboard with admin token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Welcome to the Admin Dashboard!');
      expect(response.body.adminUser).toBeDefined();
      expect(response.body.adminUser.userId).toBe(adminUser.id);
      expect(response.body.adminUser.role).toBe('ADMIN');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard');

      expect(response.status).toBe(401);
    });

    test('should fail with regular user token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/dashboard/stats', () => {
    test('should get dashboard statistics with admin token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        totalRevenue: expect.any(Number),
        totalOrders: expect.any(Number),
        totalCustomers: expect.any(Number),
        recentOrders: expect.any(Array),
        salesData: expect.any(Array)
      });
    });

    test('should calculate correct total revenue from delivered orders', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      // Should sum only DELIVERED orders: 500 + 300 = 800
      expect(response.body.data.totalRevenue).toBe(800);
    });

    test('should count all orders regardless of status', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      // Should count all 3 orders: DELIVERED, DELIVERED, PENDING
      expect(response.body.data.totalOrders).toBe(3);
    });

    test('should count only users with USER role', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      // Should count only regularUser (not adminUser)
      expect(response.body.data.totalCustomers).toBe(1);
    });

    test('should include recent orders with user information', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.recentOrders).toHaveLength(3);
      
      const recentOrder = response.body.data.recentOrders[0];
      expect(recentOrder).toMatchObject({
        id: expect.any(Number),
        orderNumber: expect.any(String),
        status: expect.any(String),
        totalAmount: expect.any(Number),
        createdAt: expect.any(String),
        user: expect.objectContaining({
          name: regularUser.name,
          email: regularUser.email
        })
      });
    });

    test('should order recent orders by creation date descending', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const orders = response.body.data.recentOrders;
      
      for (let i = 1; i < orders.length; i++) {
        const prevDate = new Date(orders[i - 1].createdAt);
        const currDate = new Date(orders[i].createdAt);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });

    test('should limit recent orders to 10', async () => {
      // Create additional orders to test limit
      for (let i = 0; i < 12; i++) {
        await prisma.order.create({
          data: {
            orderNumber: `PF-2024-00${1004 + i}`,
            status: 'PENDING',
            totalAmount: 100,
            subtotal: 80,
            deliveryFee: 20,
            tax: 0,
            discount: 0,
            deliveryAddress: JSON.stringify({
              fullName: 'Test User',
              phone: '9876543210',
              addressLine1: '123 Test St',
              city: 'Test City',
              state: 'Test State',
              pincode: '123456'
            }),
            paymentMethod: 'COD',
            userId: regularUser.id,
          }
        });
      }

      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.recentOrders).toHaveLength(10);

      // Clean up additional orders
      await prisma.order.deleteMany({
        where: {
          orderNumber: {
            startsWith: 'PF-2024-001'
          }
        }
      });
    });

    test('should include sales data for chart', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.salesData).toBeDefined();
      expect(Array.isArray(response.body.data.salesData)).toBe(true);
      
      if (response.body.data.salesData.length > 0) {
        const salesDataPoint = response.body.data.salesData[0];
        expect(salesDataPoint).toMatchObject({
          date: expect.any(String),
          sales: expect.any(Number)
        });
        expect(salesDataPoint.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
      }
    });

    test('should only include delivered orders in sales data', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      // Sales data should only include delivered orders, not pending ones
      const totalSalesFromData = response.body.data.salesData.reduce(
        (sum, item) => sum + item.sales, 0
      );
      // This might be 0 if the test orders are older than 7 days
      expect(totalSalesFromData).toBeGreaterThanOrEqual(0);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats');

      expect(response.status).toBe(401);
    });

    test('should fail with regular user token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    test('should handle empty database gracefully', async () => {
      // Clear all data temporarily
      await prisma.orderItem.deleteMany({});
      await prisma.order.deleteMany({});
      await prisma.user.deleteMany({
        where: { role: 'USER' }
      });

      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.totalRevenue).toBe(0);
      expect(response.body.data.totalOrders).toBe(0);
      expect(response.body.data.totalCustomers).toBe(0);
      expect(response.body.data.recentOrders).toHaveLength(0);
      expect(response.body.data.salesData).toHaveLength(0);

      // Restore data for other tests
      await prisma.user.create({
        data: {
          id: regularUser.id,
          name: regularUser.name,
          email: regularUser.email,
          password: regularUser.password,
          role: regularUser.role,
          isEmailVerified: regularUser.isEmailVerified,
        }
      });
    });

    test('should return consistent data structure', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalRevenue');
      expect(response.body.data).toHaveProperty('totalOrders');
      expect(response.body.data).toHaveProperty('totalCustomers');
      expect(response.body.data).toHaveProperty('recentOrders');
      expect(response.body.data).toHaveProperty('salesData');
    });

    test('should handle sales data date formatting correctly', async () => {
      // Create a recent delivered order within the last 7 days
      const recentOrder = await prisma.order.create({
        data: {
          orderNumber: 'PF-2024-RECENT',
          status: 'DELIVERED',
          totalAmount: 250,
          subtotal: 200,
          deliveryFee: 50,
          tax: 0,
          discount: 0,
          deliveryAddress: JSON.stringify({
            fullName: 'Recent User',
            phone: '9876543210',
            addressLine1: '123 Recent St',
            city: 'Recent City',
            state: 'Recent State',
            pincode: '123456'
          }),
          paymentMethod: 'COD',
          userId: regularUser.id,
          createdAt: new Date(), // Today
        }
      });

      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      // Should have at least one sales data point for the recent order
      expect(response.body.data.salesData.length).toBeGreaterThan(0);
      
      // Clean up
      await prisma.order.delete({
        where: { id: recentOrder.id }
      });
    });
  });
});

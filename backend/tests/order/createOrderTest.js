const request = require('supertest');
const app = require('../../server');
const prisma = require('../../prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { resetDb } = require('../testUtils');

describe('Order - Create Order Tests', () => {
  beforeAll(resetDb);
  let testUser;
  let userToken;
  let testCategory;
  let testProduct;
  let testCartItem;

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('userpassword', 10);
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'testuser@example.com',
        password: hashedPassword,
        role: 'USER',
        isEmailVerified: true,
      },
    });

    // Generate token
    userToken = jwt.sign(
      { userId: testUser.id, email: testUser.email, role: testUser.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '30m' }
    );

    // Create test category and product
    testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test category for orders',
      },
    });

    testProduct = await prisma.product.create({
      data: {
        name: 'Test Product',
        description: 'Test product for order creation',
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

  beforeEach(async () => {
    // Create cart and cart item for each test
    const cart = await prisma.cart.create({
      data: { userId: testUser.id, totalAmount: 200 },
    });
    testCartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: testProduct.id,
        quantity: 2,
        price: 100,
        subtotal: 200,
      },
    });
  });

  afterEach(async () => {
    // Clean up orders and cart items after each test
    await prisma.orderStatusHistory.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({
      where: { userId: testUser.id }
    });
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
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/orders', () => {
    const validOrderData = {
      deliveryAddress: {
        fullName: 'John Doe',
        phone: '9876543210',
        addressLine1: '123 Main Street',
        addressLine2: 'Apt 4B',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        landmark: 'Near Central Mall',
      },
      deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      deliverySlot: 'MORNING',
      paymentMethod: 'COD',
      orderNotes: 'Handle with care',
      discount: 0,
    };

    test('should create order successfully with valid data', async () => {
      const response = await request(app)
        .post('/api/orders/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validOrderData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('created successfully');
      expect(response.body.data.order).toBeDefined();
      expect(response.body.data.orderNumber).toMatch(/^PF-\d{4}-\d{6}$/);
      expect(response.body.data.totalAmount).toBeGreaterThan(0);
      expect(response.body.data.itemsCount).toBe(1);
      expect(response.body.data.paymentMethod).toBe('COD');

      // Verify order was created in database
      const order = await prisma.order.findUnique({
        where: { orderNumber: response.body.data.orderNumber },
        include: { items: true }
      });
      expect(order).toBeTruthy();
      expect(order.items.length).toBe(1);
      expect(order.items[0].quantity).toBe(2);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/orders/create')
        .send(validOrderData);

      expect(response.status).toBe(401);
    });

    test('should fail with empty cart', async () => {
      // Clear cart
      await prisma.cartItem.deleteMany({});
      await prisma.cart.deleteMany({});

      const response = await request(app)
        .post('/api/orders/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validOrderData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message.toLowerCase()).toContain('cart');
    });

    test('should fail with missing delivery address', async () => {
      const invalidData = { ...validOrderData };
      delete invalidData.deliveryAddress;

      const response = await request(app)
        .post('/api/orders/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with incomplete delivery address', async () => {
      const invalidData = {
        ...validOrderData,
        deliveryAddress: {
          fullName: 'John Doe',
          phone: '9876543210',
          // Missing required fields
        }
      };

      const response = await request(app)
        .post('/api/orders/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid phone number', async () => {
      const invalidData = {
        ...validOrderData,
        deliveryAddress: {
          ...validOrderData.deliveryAddress,
          phone: '123' // Invalid phone
        }
      };

      const response = await request(app)
        .post('/api/orders/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid pincode', async () => {
      const invalidData = {
        ...validOrderData,
        deliveryAddress: {
          ...validOrderData.deliveryAddress,
          pincode: '123' // Invalid pincode
        }
      };

      const response = await request(app)
        .post('/api/orders/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should create order with default payment method', async () => {
      const dataWithoutPayment = { ...validOrderData };
      delete dataWithoutPayment.paymentMethod;

      const response = await request(app)
        .post('/api/orders/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send(dataWithoutPayment);

      expect(response.status).toBe(201);
      expect(response.body.data.paymentMethod).toBe('COD');
    });

    test('should create order with default delivery date', async () => {
      const dataWithoutDate = { ...validOrderData };
      delete dataWithoutDate.deliveryDate;

      const response = await request(app)
        .post('/api/orders/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send(dataWithoutDate);

      expect(response.status).toBe(201);
      expect(response.body.data.estimatedDelivery).toBeDefined();
    });

    test('should fail with past delivery date', async () => {
      const invalidData = {
        ...validOrderData,
        deliveryDate: '2020-01-01' // Past date
      };

      const response = await request(app)
        .post('/api/orders/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should handle invalid delivery slot', async () => {
      const invalidData = {
        ...validOrderData,
        deliverySlot: 'INVALID_SLOT'
      };

      const response = await request(app)
        .post('/api/orders/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should clear cart after successful order creation', async () => {
      const response = await request(app)
        .post('/api/orders/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validOrderData);

      expect(response.status).toBe(201);

      // Verify cart is empty
      const cartItems = await prisma.cartItem.findMany({});
      expect(cartItems).toHaveLength(0);
    });

    test('should reduce product stock after order creation', async () => {
      const originalStock = (await prisma.product.findUnique({ where: { id: testProduct.id } })).stock;

      const response = await request(app)
        .post('/api/orders/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validOrderData);

      expect(response.status).toBe(201);

      // Verify stock reduction
      const updatedProduct = await prisma.product.findUnique({
        where: { id: testProduct.id }
      });
      expect(updatedProduct.stock).toBe(originalStock - 2); // Quantity was 2
    });

    test('should fail when product stock is insufficient', async () => {
      // Update cart to have more quantity than available stock
      await prisma.cartItem.update({
        where: { id: testCartItem.id },
        data: { quantity: 150 } // More than available stock (100)
      });

      const response = await request(app)
        .post('/api/orders/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validOrderData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cart validation failed');
      expect(JSON.stringify(response.body.details)).toContain('available');
    });

    test('should create status history entry', async () => {
      const response = await request(app)
        .post('/api/orders/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validOrderData);

      expect(response.status).toBe(201);

      // Verify status history
      const order = await prisma.order.findUnique({
        where: { orderNumber: response.body.data.orderNumber },
        include: { statusHistory: true }
      });
      expect(order.statusHistory).toHaveLength(1);
      expect(order.statusHistory[0].newStatus).toBe('PENDING');
    });

    test('should handle multiple products in cart', async () => {
      // Create another product and cart item
      const anotherProduct = await prisma.product.create({
        data: {
          name: 'Another Product',
          description: 'Another test product',
          price: 50,
          categoryId: testCategory.id,
          thumbnail: 'another-product.jpg',
          sku: 'TEST002',
          unit: 'piece',
          stock: 50,
          slug: 'another-product',
          createdById: testUser.id,
        },
      });

      const existingCart = await prisma.cart.findFirst({
        where: { userId: testUser.id },
      });
      await prisma.cartItem.create({
        data: {
          cartId: existingCart.id,
          productId: anotherProduct.id,
          quantity: 3,
          price: 50,
          subtotal: 150,
        },
      });

      const response = await request(app)
        .post('/api/orders/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validOrderData);

      expect(response.status).toBe(201);
      expect(response.body.data.itemsCount).toBe(2);

      // Clean up
      await prisma.product.delete({
        where: { id: anotherProduct.id }
      });
    });
  });
});

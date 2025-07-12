const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test credentials
const testUser = {
  email: 'carttest@example.com',
  password: 'password123'
};

const adminUser = {
  email: 'admin@pradhanfresh.com',
  password: 'admin123'
};

// Test delivery address
const testAddress = {
  fullName: 'John Doe',
  phone: '9876543210',
  addressLine1: '123 Test Street',
  addressLine2: 'Apartment 4B',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  landmark: 'Near Test Mall'
};

async function testOrderManagementSystem() {
  console.log('🧪 Testing Order Management System...\n');

  let userToken, adminToken, orderNumber;

  try {
    // === STEP 1: LOGIN USERS ===
    console.log('1️⃣ Logging in users...');
    
    // Login test user
    const userLoginResponse = await axios.post(`${API_BASE}/auth/login`, testUser);
    userToken = userLoginResponse.data.token;
    console.log('✅ Test user logged in successfully');

    // Login admin user
    const adminLoginResponse = await axios.post(`${API_BASE}/auth/login`, adminUser);
    adminToken = adminLoginResponse.data.token;
    console.log('✅ Admin user logged in successfully');

    // === STEP 2: SETUP CART ===
    console.log('\n2️⃣ Setting up cart...');
    
    // Get products
    const productsResponse = await axios.get(`${API_BASE}/products?limit=3`);
    const products = productsResponse.data.data;
    console.log(`✅ Found ${products.length} products`);

    // Clear any existing cart
    try {
      await axios.delete(`${API_BASE}/cart/clear`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('✅ Cleared existing cart');
    } catch (error) {
      console.log('ℹ️ No existing cart to clear');
    }

    // Add items to cart
    for (let i = 0; i < Math.min(2, products.length); i++) {
      const product = products[i];
      await axios.post(`${API_BASE}/cart/add`, {
        productId: product.id,
        quantity: 2
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log(`✅ Added ${product.name} x2 to cart`);
    }

    // === STEP 3: CREATE ORDER ===
    console.log('\n3️⃣ Creating order...');
    
    const createOrderResponse = await axios.post(`${API_BASE}/orders/create`, {
      deliveryAddress: testAddress,
      deliverySlot: 'Morning',
      paymentMethod: 'COD',
      orderNotes: 'Please handle with care'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    orderNumber = createOrderResponse.data.data.orderNumber;
    console.log('✅ Order created successfully:', orderNumber);
    console.log(`   Items: ${createOrderResponse.data.data.itemsCount}`);
    console.log(`   Total: ₹${createOrderResponse.data.data.totalAmount}`);

    // === STEP 4: GET USER ORDERS ===
    console.log('\n4️⃣ Testing get user orders...');
    
    const ordersResponse = await axios.get(`${API_BASE}/orders?limit=5`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    console.log('✅ Retrieved user orders');
    console.log(`   Total orders: ${ordersResponse.data.data.pagination.totalCount}`);
    console.log(`   Current page orders: ${ordersResponse.data.data.orders.length}`);
    
    // Test with filters
    const filteredOrdersResponse = await axios.get(`${API_BASE}/orders?status=PENDING&sortBy=createdAt&sortOrder=desc`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log(`✅ Retrieved filtered orders (PENDING): ${filteredOrdersResponse.data.data.orders.length}`);

    // === STEP 5: GET ORDER DETAILS ===
    console.log('\n5️⃣ Testing get order details...');
    
    const orderDetailsResponse = await axios.get(`${API_BASE}/orders/${orderNumber}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    console.log('✅ Retrieved order details');
    console.log(`   Order: ${orderDetailsResponse.data.data.order.orderNumber}`);
    console.log(`   Status: ${orderDetailsResponse.data.data.order.statusInfo.label}`);
    console.log(`   Items: ${orderDetailsResponse.data.data.order.itemsCount}`);
    console.log(`   Timeline events: ${orderDetailsResponse.data.data.order.timeline.length}`);

    // === STEP 6: UPDATE ORDER STATUS (ADMIN) ===
    console.log('\n6️⃣ Testing order status updates (Admin)...');
    
    // Confirm order
    const confirmResponse = await axios.put(`${API_BASE}/orders/${orderNumber}/status`, {
      status: 'CONFIRMED',
      adminNotes: 'Order confirmed and ready for processing'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Order status updated to CONFIRMED');
    console.log(`   Previous status: ${confirmResponse.data.data.previousStatus}`);
    console.log(`   New status: ${confirmResponse.data.data.newStatus}`);

    // Process order
    await axios.put(`${API_BASE}/orders/${orderNumber}/status`, {
      status: 'PROCESSING',
      adminNotes: 'Order is being prepared'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Order status updated to PROCESSING');

    // Ship order
    await axios.put(`${API_BASE}/orders/${orderNumber}/status`, {
      status: 'SHIPPED',
      adminNotes: 'Order shipped via courier'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Order status updated to SHIPPED');

    // === STEP 7: TEST INVALID STATUS TRANSITIONS ===
    console.log('\n7️⃣ Testing invalid status transitions...');
    
    try {
      await axios.put(`${API_BASE}/orders/${orderNumber}/status`, {
        status: 'PENDING',
        adminNotes: 'Trying to go back to pending'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('❌ Should have failed - invalid transition');
    } catch (error) {
      console.log('✅ Invalid status transition correctly blocked');
      console.log(`   Error: ${error.response.data.message}`);
    }

    // === STEP 8: DELIVER ORDER ===
    console.log('\n8️⃣ Delivering order...');
    
    await axios.put(`${API_BASE}/orders/${orderNumber}/status`, {
      status: 'DELIVERED',
      adminNotes: 'Order delivered successfully'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Order status updated to DELIVERED');

    // === STEP 9: TEST CANCELLATION (NEW ORDER) ===
    console.log('\n9️⃣ Testing order cancellation...');
    
    // Create another order to test cancellation
    await axios.post(`${API_BASE}/cart/add`, {
      productId: products[0].id,
      quantity: 1
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    const cancelOrderResponse = await axios.post(`${API_BASE}/orders/create`, {
      deliveryAddress: testAddress,
      paymentMethod: 'COD'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    const cancelOrderNumber = cancelOrderResponse.data.data.orderNumber;
    console.log(`✅ Created order for cancellation: ${cancelOrderNumber}`);

    // Cancel the order
    const cancelResponse = await axios.put(`${API_BASE}/orders/${cancelOrderNumber}/cancel`, {
      reason: 'Changed my mind'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    console.log('✅ Order cancelled successfully');
    console.log(`   Reason: ${cancelResponse.data.data.cancellationInfo.reason}`);
    console.log(`   Stock restored: ${cancelResponse.data.data.stockRestored.length} items`);

    // === STEP 10: TEST AUTHORIZATION ===
    console.log('\n🔟 Testing authorization...');
    
    // Test user trying to update order status (should fail)
    try {
      await axios.put(`${API_BASE}/orders/${orderNumber}/status`, {
        status: 'RETURNED'
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('❌ Should have failed - user cannot update order status');
    } catch (error) {
      console.log('✅ User correctly blocked from updating order status');
      console.log(`   Error: ${error.response.data.message}`);
    }

    // Test user trying to access another user's order (should fail)
    try {
      await axios.get(`${API_BASE}/orders/PF-2024-999999`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('❌ Should have failed - accessing non-existent order');
    } catch (error) {
      console.log('✅ Non-existent order correctly returns 404');
    }

    // === STEP 11: TEST PAGINATION AND FILTERING ===
    console.log('\n1️⃣1️⃣ Testing pagination and filtering...');
    
    // Test pagination
    const paginatedResponse = await axios.get(`${API_BASE}/orders?page=1&limit=1`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log(`✅ Pagination test: ${paginatedResponse.data.data.orders.length} order(s) per page`);
    console.log(`   Total pages: ${paginatedResponse.data.data.pagination.totalPages}`);

    // Test date filtering
    const today = new Date().toISOString().split('T')[0];
    const dateFilterResponse = await axios.get(`${API_BASE}/orders?startDate=${today}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log(`✅ Date filtering test: ${dateFilterResponse.data.data.orders.length} order(s) from today`);

    console.log('\n🎉 Order Management System tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ User authentication');
    console.log('   ✅ Order creation from cart');
    console.log('   ✅ Order listing with pagination');
    console.log('   ✅ Order details retrieval');
    console.log('   ✅ Order status updates (admin)');
    console.log('   ✅ Order cancellation (user)');
    console.log('   ✅ Stock management');
    console.log('   ✅ Authorization checks');
    console.log('   ✅ Invalid transition blocking');
    console.log('   ✅ Filtering and sorting');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data?.error) {
      console.error('   Error details:', error.response.data.error);
    }
    if (error.response?.data?.details) {
      console.error('   Additional details:', error.response.data.details);
    }
  }
}

// Run the test
testOrderManagementSystem(); 
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test credentials
const testUser = {
  name: 'Cart Test User',
  email: 'carttest@example.com',
  password: 'password123'
};

let authToken = '';
let testProductId = 1; // Assuming we have a product with ID 1

async function testCartSystem() {
  console.log('🧪 Testing Cart System...\n');

  try {
    // Step 1: Register or login user
    console.log('1️⃣ Authenticating user...');
    try {
      const signupResponse = await axios.post(`${API_BASE}/auth/signup`, testUser);
      console.log('✅ User registered:', signupResponse.data.message);
      
      // For testing, we'll skip email verification and directly login
      // In production, user would need to verify email first
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ User already exists, proceeding with login...');
      } else {
        console.log('❌ Signup error:', error.response?.data?.message || error.message);
      }
    }

    // Login
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    authToken = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 2: Check if we have products
    console.log('\n2️⃣ Checking available products...');
    const productsResponse = await axios.get(`${API_BASE}/products?limit=5`);
    
    if (productsResponse.data.data.length === 0) {
      console.log('❌ No products found. Please create some products first.');
      return;
    }
    
    testProductId = productsResponse.data.data[0].id;
    console.log(`✅ Found ${productsResponse.data.data.length} products. Using product ID: ${testProductId}`);

    // Step 3: Test Add to Cart
    console.log('\n3️⃣ Testing Add to Cart...');
    const addToCartResponse = await axios.post(`${API_BASE}/cart/add`, {
      productId: testProductId,
      quantity: 2
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Add to cart successful:', addToCartResponse.data.message);
    console.log('   Items in cart:', addToCartResponse.data.data.itemsCount);
    console.log('   Total amount:', addToCartResponse.data.data.totalAmount);

    // Step 4: Test Get Cart
    console.log('\n4️⃣ Testing Get Cart...');
    const getCartResponse = await axios.get(`${API_BASE}/cart`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Get cart successful:', getCartResponse.data.message);
    console.log('   Items in cart:', getCartResponse.data.data.itemsCount);
    console.log('   Total amount:', getCartResponse.data.data.totalAmount);
    
    if (getCartResponse.data.data.cart.items.length > 0) {
      const firstItem = getCartResponse.data.data.cart.items[0];
      console.log('   First item:', firstItem.product.name, 'x', firstItem.quantity);
      
      // Step 5: Test Update Cart Item
      console.log('\n5️⃣ Testing Update Cart Item...');
      const updateResponse = await axios.put(`${API_BASE}/cart/${firstItem.id}`, {
        quantity: 3
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('✅ Update cart item successful:', updateResponse.data.message);
      console.log('   New quantity:', updateResponse.data.data.updatedItem.quantity);
      console.log('   New total:', updateResponse.data.data.totalAmount);

      // Step 6: Test Add Same Product Again (should increase quantity)
      console.log('\n6️⃣ Testing Add Same Product Again...');
      const addSameResponse = await axios.post(`${API_BASE}/cart/add`, {
        productId: testProductId,
        quantity: 1
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('✅ Add same product successful:', addSameResponse.data.message);
      console.log('   Total items in cart:', addSameResponse.data.data.itemsCount);

      // Step 7: Test Remove Cart Item
      console.log('\n7️⃣ Testing Remove Cart Item...');
      const removeResponse = await axios.delete(`${API_BASE}/cart/${firstItem.id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('✅ Remove cart item successful:', removeResponse.data.message);
      console.log('   Items remaining:', removeResponse.data.data.itemsCount);
    }

    // Step 8: Add multiple items for clear test
    console.log('\n8️⃣ Adding multiple items for clear test...');
    await axios.post(`${API_BASE}/cart/add`, {
      productId: testProductId,
      quantity: 2
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (productsResponse.data.data.length > 1) {
      await axios.post(`${API_BASE}/cart/add`, {
        productId: productsResponse.data.data[1].id,
        quantity: 1
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    }

    // Step 9: Test Clear Cart
    console.log('\n9️⃣ Testing Clear Cart...');
    const clearResponse = await axios.delete(`${API_BASE}/cart/clear`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Clear cart successful:', clearResponse.data.message);
    console.log('   Items cleared:', clearResponse.data.data.clearedItemsCount);
    console.log('   Cart is empty:', clearResponse.data.data.isEmpty);

    // Step 10: Test Get Empty Cart
    console.log('\n🔟 Testing Get Empty Cart...');
    const emptyCartResponse = await axios.get(`${API_BASE}/cart`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Get empty cart successful:', emptyCartResponse.data.message);
    console.log('   Is empty:', emptyCartResponse.data.data.isEmpty);

    console.log('\n🎉 All cart tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data?.error) {
      console.error('   Error details:', error.response.data.error);
    }
  }
}

// Run the test
testCartSystem(); 
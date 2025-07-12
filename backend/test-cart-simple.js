const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test credentials
const testUser = {
  email: 'carttest@example.com',
  password: 'password123'
};

async function testClearCart() {
  console.log('🧪 Testing Clear Cart Functionality...\n');

  try {
    // Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, testUser);
    const authToken = loginResponse.data.token;
    console.log('✅ Login successful');

    // Get products
    console.log('\n2️⃣ Getting products...');
    const productsResponse = await axios.get(`${API_BASE}/products?limit=3`);
    const products = productsResponse.data.data;
    console.log(`✅ Found ${products.length} products`);

    // Add multiple items to cart
    console.log('\n3️⃣ Adding items to cart...');
    for (let i = 0; i < Math.min(2, products.length); i++) {
      const product = products[i];
      await axios.post(`${API_BASE}/cart/add`, {
        productId: product.id,
        quantity: i + 1
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log(`✅ Added ${product.name} x${i + 1} to cart`);
    }

    // Get cart to verify items
    console.log('\n4️⃣ Checking cart contents...');
    const cartResponse = await axios.get(`${API_BASE}/cart`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Cart has ${cartResponse.data.data.itemsCount} items`);
    console.log(`   Total amount: ₹${cartResponse.data.data.totalAmount}`);

    // Clear cart
    console.log('\n5️⃣ Clearing cart...');
    const clearResponse = await axios.delete(`${API_BASE}/cart/clear`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Clear cart successful:', clearResponse.data.message);
    console.log(`   Items cleared: ${clearResponse.data.data.clearedItemsCount}`);

    // Verify cart is empty
    console.log('\n6️⃣ Verifying cart is empty...');
    const emptyCartResponse = await axios.get(`${API_BASE}/cart`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Cart status:', emptyCartResponse.data.message);
    console.log(`   Is empty: ${emptyCartResponse.data.data.isEmpty}`);

    console.log('\n🎉 Clear cart test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data?.error) {
      console.error('   Error details:', error.response.data.error);
    }
  }
}

testClearCart(); 
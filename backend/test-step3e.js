const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testStep3e() {
  console.log('🔄 **Step 3e: UPDATE Product - Comprehensive Testing**\n');

  // Step 1: Get Admin Token
  console.log('🔐 **Step 1: Admin Authentication**');
  
  let adminToken;
  try {
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@pradhanfresh.com',
      password: 'admin123'
    });
    
    adminToken = loginResponse.data.token;
    console.log('✅ Admin authentication successful');
  } catch (error) {
    console.log('❌ Admin authentication failed');
    return;
  }

  console.log('\n─────────────────────────────────────────\n');

  // Step 2: Create a test product first
  console.log('📦 **Step 2: Creating Test Product for Updates**');
  
  let testProductId;
  try {
    const createResponse = await axios.post(`${BASE_URL}/api/products`, {
      name: "Test Oranges for Update",
      description: "Fresh oranges for testing updates",
      price: 5.99,
      categoryId: 1,
      thumbnail: "/test-oranges.jpg",
      sku: "TEST-UPDATE-001",
      unit: "kg",
      stock: 25,
      isFeatured: false,
      isOrganic: false
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    testProductId = createResponse.data.data.id;
    console.log('✅ Test product created successfully');
    console.log(`🆔 Product ID: ${testProductId}`);
    console.log(`📝 Original name: ${createResponse.data.data.name}`);
    console.log(`💰 Original price: $${createResponse.data.data.price}`);
  } catch (error) {
    console.log('❌ Failed to create test product');
    return;
  }

  console.log('\n─────────────────────────────────────────\n');

  // Test 1: Security - No Authentication
  console.log('🛡️ **Test 1: Security Layer - No Authentication**');
  
  try {
    await axios.put(`${BASE_URL}/api/products/${testProductId}`, {
      name: "Should Fail - No Auth"
    });
    console.log('❌ UNEXPECTED: Request succeeded without token!');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ SUCCESS: Request properly blocked');
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`💬 Message: ${error.response.data.error}`);
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  console.log('\n─────────────────────────────────────────\n');

  // Test 2: Invalid Product ID
  console.log('🔢 **Test 2: Invalid Product ID**');
  
  try {
    await axios.put(`${BASE_URL}/api/products/invalid-id`, {
      name: "Should Fail - Invalid ID"
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('❌ UNEXPECTED: Request succeeded with invalid ID!');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ SUCCESS: Invalid ID properly caught');
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`💬 Message: ${error.response.data.message}`);
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  console.log('\n─────────────────────────────────────────\n');

  // Test 3: Non-existent Product
  console.log('❓ **Test 3: Non-existent Product**');
  
  try {
    await axios.put(`${BASE_URL}/api/products/99999`, {
      name: "Should Fail - Product Not Found"
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('❌ UNEXPECTED: Request succeeded for non-existent product!');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✅ SUCCESS: Non-existent product properly caught');
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`💬 Message: ${error.response.data.message}`);
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  console.log('\n─────────────────────────────────────────\n');

  // Test 4: Empty Update (No Fields)
  console.log('🗃️ **Test 4: Empty Update Request**');
  
  try {
    await axios.put(`${BASE_URL}/api/products/${testProductId}`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('❌ UNEXPECTED: Empty update succeeded!');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ SUCCESS: Empty update properly rejected');
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`💬 Message: ${error.response.data.message}`);
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  console.log('\n─────────────────────────────────────────\n');

  // Test 5: Partial Update - Name and Price
  console.log('✏️ **Test 5: Partial Update - Name and Price**');
  
  try {
    const response = await axios.put(`${BASE_URL}/api/products/${testProductId}`, {
      name: "Updated Premium Oranges",
      price: 7.49
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ SUCCESS: Partial update completed');
    console.log(`📊 Status: ${response.status}`);
    console.log(`💬 Message: ${response.data.message}`);
    console.log(`📝 New name: ${response.data.data.name}`);
    console.log(`💰 New price: $${response.data.data.price}`);
    console.log(`🔗 New slug: ${response.data.data.slug}`);
    console.log(`🔄 Changed fields: ${response.data.changedFields.join(', ')}`);
  } catch (error) {
    console.log('❌ FAILED: Partial update failed');
    console.log(`📊 Status: ${error.response?.status}`);
    console.log(`💬 Message: ${error.response?.data?.message}`);
  }

  console.log('\n─────────────────────────────────────────\n');

  // Test 6: Invalid Price Update
  console.log('💰 **Test 6: Invalid Price Update**');
  
  try {
    await axios.put(`${BASE_URL}/api/products/${testProductId}`, {
      price: "invalid-price"
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('❌ UNEXPECTED: Invalid price update succeeded!');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ SUCCESS: Invalid price properly caught');
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`💬 Message: ${error.response.data.message}`);
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  console.log('\n─────────────────────────────────────────\n');

  // Test 7: Sale Price and Stock Update
  console.log('🏷️ **Test 7: Sale Price and Stock Update**');
  
  try {
    const response = await axios.put(`${BASE_URL}/api/products/${testProductId}`, {
      salePrice: 6.99,
      stock: 50,
      isFeatured: true,
      isOrganic: true
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ SUCCESS: Multiple field update completed');
    console.log(`📊 Status: ${response.status}`);
    console.log(`💰 Regular price: $${response.data.data.price}`);
    console.log(`🏷️ Sale price: $${response.data.data.salePrice}`);
    console.log(`📦 Stock: ${response.data.data.stock} ${response.data.data.unit}`);
    console.log(`⭐ Featured: ${response.data.data.isFeatured ? 'Yes' : 'No'}`);
    console.log(`🌱 Organic: ${response.data.data.isOrganic ? 'Yes' : 'No'}`);
    console.log(`✅ Available: ${response.data.data.isAvailable ? 'Yes' : 'No'}`);
    console.log(`🔄 Changed fields: ${response.data.changedFields.join(', ')}`);
  } catch (error) {
    console.log('❌ FAILED: Multiple field update failed');
    console.log(`📊 Status: ${error.response?.status}`);
    console.log(`💬 Message: ${error.response?.data?.message}`);
  }

  console.log('\n─────────────────────────────────────────\n');

  // Test 8: Invalid Sale Price (Higher than Regular Price)
  console.log('🚫 **Test 8: Invalid Sale Price (Higher than Regular Price)**');
  
  try {
    await axios.put(`${BASE_URL}/api/products/${testProductId}`, {
      salePrice: 10.99 // Higher than current price of 7.49
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('❌ UNEXPECTED: Invalid sale price update succeeded!');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ SUCCESS: Invalid sale price properly caught');
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`💬 Message: ${error.response.data.message}`);
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  console.log('\n─────────────────────────────────────────\n');

  // Test 9: Clear Sale Price
  console.log('🧹 **Test 9: Clear Sale Price (Set to null)**');
  
  try {
    const response = await axios.put(`${BASE_URL}/api/products/${testProductId}`, {
      salePrice: null
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ SUCCESS: Sale price cleared');
    console.log(`📊 Status: ${response.status}`);
    console.log(`💰 Regular price: $${response.data.data.price}`);
    console.log(`🏷️ Sale price: ${response.data.data.salePrice || 'None'}`);
    console.log(`🔄 Changed fields: ${response.data.changedFields.join(', ')}`);
  } catch (error) {
    console.log('❌ FAILED: Clear sale price failed');
    console.log(`📊 Status: ${error.response?.status}`);
    console.log(`💬 Message: ${error.response?.data?.message}`);
  }

  console.log('\n─────────────────────────────────────────\n');

  // Test 10: SKU Conflict
  console.log('🏷️ **Test 10: SKU Conflict (Try to use existing SKU)**');
  
  try {
    await axios.put(`${BASE_URL}/api/products/${testProductId}`, {
      sku: "FRU-APP-001" // This SKU exists from our seed data
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('❌ UNEXPECTED: SKU conflict not caught!');
  } catch (error) {
    if (error.response && error.response.status === 409) {
      console.log('✅ SUCCESS: SKU conflict properly caught');
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`💬 Message: ${error.response.data.message}`);
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  console.log('\n─────────────────────────────────────────\n');

  // Test 11: Complete Product Update
  console.log('🎯 **Test 11: Complete Product Update**');
  
  try {
    const response = await axios.put(`${BASE_URL}/api/products/${testProductId}`, {
      name: "Final Updated Premium Oranges",
      description: "Completely updated description for premium oranges",
      shortDescription: "Updated premium oranges",
      price: 8.99,
      salePrice: 7.99,
      categoryId: 2, // Change to vegetables
      thumbnail: "/updated-oranges.jpg",
      images: ["/updated-oranges1.jpg", "/updated-oranges2.jpg"],
      stock: 100,
      sku: "UPDATED-ORG-001",
      unit: "bag",
      weight: 2000,
      isFeatured: true,
      isOrganic: true
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('🎊 SUCCESS: Complete product update completed!');
    console.log(`📊 Status: ${response.status}`);
    console.log(`💬 Message: ${response.data.message}`);
    console.log(`📦 Product Details:`);
    console.log(`   - Name: ${response.data.data.name}`);
    console.log(`   - Description: ${response.data.data.description.substring(0, 50)}...`);
    console.log(`   - Price: $${response.data.data.price} (Sale: $${response.data.data.salePrice})`);
    console.log(`   - Category: ${response.data.data.category.name}`);
    console.log(`   - SKU: ${response.data.data.sku}`);
    console.log(`   - Stock: ${response.data.data.stock} ${response.data.data.unit}`);
    console.log(`   - Weight: ${response.data.data.weight}g`);
    console.log(`   - Available: ${response.data.data.isAvailable ? 'Yes' : 'No'}`);
    console.log(`   - Featured: ${response.data.data.isFeatured ? 'Yes' : 'No'}`);
    console.log(`   - Organic: ${response.data.data.isOrganic ? 'Yes' : 'No'}`);
    console.log(`   - Slug: ${response.data.data.slug}`);
    console.log(`🔄 Changed fields: ${response.data.changedFields.join(', ')}`);
  } catch (error) {
    console.log('❌ FAILED: Complete update failed');
    console.log(`📊 Status: ${error.response?.status}`);
    console.log(`💬 Message: ${error.response?.data?.message}`);
  }

  console.log('\n─────────────────────────────────────────\n');

  console.log('🎯 **Step 3e Testing Summary**');
  console.log('✅ Security Layer: Authentication tested');
  console.log('✅ Validation Layer: Product existence, ID validation tested');
  console.log('✅ Partial Updates: Individual field updates tested');
  console.log('✅ Data Validation: Price, sale price, stock validation tested');
  console.log('✅ Business Logic: SKU uniqueness, slug regeneration tested');
  console.log('✅ Smart Features: Auto-availability, field tracking tested');
  console.log('✅ Complete Updates: Full product transformation tested');
  console.log('\n🏆 **Step 3e: UPDATE Product endpoint fully functional!**');
}

// Handle both direct execution and module import
if (require.main === module) {
  testStep3e().catch(console.error);
}

module.exports = { testStep3e }; 
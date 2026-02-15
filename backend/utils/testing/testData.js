// Test user credentials
const testUsers = {
  regularUser: {
    email: 'carttest@example.com',
    password: 'password123',
    name: 'Test User'
  },
  adminUser: {
    email: 'admin@pradhanfresh.com',
    password: 'admin123',
    name: 'Admin User'
  }
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

// Test categories data
const testCategories = [
  {
    name: 'Fruits',
    slug: 'fruits',
    description: 'Fresh seasonal fruits',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400',
    isActive: true
  },
  {
    name: 'Vegetables',
    slug: 'vegetables',
    description: 'Fresh organic vegetables',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
    isActive: true
  },
  {
    name: 'Leafy Greens',
    slug: 'leafy-greens',
    description: 'Fresh leafy vegetables packed with nutrients',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
    isActive: true
  }
];

// Test products data
const testProducts = [
  {
    name: 'Fresh Apples',
    description: 'Crisp and sweet red apples',
    shortDescription: 'Premium quality apples',
    price: 150.00,
    salePrice: 120.00,
    thumbnail: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400',
    images: ['https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400'],
    stock: 100,
    sku: 'FRUIT-APPLE-001',
    unit: 'kg',
    weight: 1.0,
    isFeatured: true,
    isOrganic: false,
    categorySlug: 'fruits'
  },
  {
    name: 'Fresh Bananas',
    description: 'Yellow ripe bananas perfect for snacking',
    shortDescription: 'Sweet and nutritious bananas',
    price: 80.00,
    thumbnail: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400',
    images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400'],
    stock: 150,
    sku: 'FRUIT-BANANA-001',
    unit: 'dozen',
    weight: 2.0,
    isFeatured: false,
    isOrganic: true,
    categorySlug: 'fruits'
  },
  {
    name: 'Fresh Tomatoes',
    description: 'Red ripe tomatoes perfect for cooking',
    shortDescription: 'Farm fresh tomatoes',
    price: 60.00,
    salePrice: 50.00,
    thumbnail: 'https://images.unsplash.com/photo-1546470427-e5e5e80b6b24?w=400',
    images: ['https://images.unsplash.com/photo-1546470427-e5e5e80b6b24?w=400'],
    stock: 200,
    sku: 'VEG-TOMATO-001',
    unit: 'kg',
    weight: 1.0,
    isFeatured: true,
    isOrganic: false,
    categorySlug: 'vegetables'
  },
  {
    name: 'Fresh Spinach',
    description: 'Organic spinach leaves rich in iron',
    shortDescription: 'Nutrient-rich spinach',
    price: 40.00,
    thumbnail: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
    images: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400'],
    stock: 80,
    sku: 'LEAFY-SPINACH-001',
    unit: 'bunch',
    weight: 0.25,
    isFeatured: false,
    isOrganic: true,
    categorySlug: 'leafy-greens'
  }
];

// API endpoints for testing
const apiEndpoints = {
  base: 'http://localhost:5000/api',
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    logout: '/auth/logout'
  },
  cart: {
    add: '/cart/add',
    get: '/cart',
    update: '/cart/update',
    remove: '/cart/remove',
    clear: '/cart/clear'
  },
  orders: {
    create: '/orders',
    get: '/orders',
    details: '/orders',
    cancel: '/orders',
    updateStatus: '/orders'
  },
  products: {
    get: '/products',
    getById: '/products'
  },
  admin: {
    orders: '/admin/orders',
    users: '/admin/users'
  }
};

module.exports = {
  testUsers,
  testAddress,
  testCategories,
  testProducts,
  apiEndpoints
};

/*
=== TEST DATA MODULE ===

This module provides standardized test data for testing and seeding operations.

KEY DATA SETS:

1. **Test Users**:
   - Regular user for standard testing
   - Admin user for administrative testing
   - Consistent credentials across tests

2. **Test Address**:
   - Valid Indian address format
   - Complete delivery information
   - Reusable across multiple tests

3. **Test Categories**:
   - Common product categories
   - Valid slugs and descriptions
   - External image URLs for testing

4. **Test Products**:
   - Products across different categories
   - Varied pricing and stock levels
   - Mix of featured and organic products

5. **API Endpoints**:
   - Centralized endpoint definitions
   - Organized by functional areas
   - Easy to maintain and update

DATA CHARACTERISTICS:

**User Data**:
- Valid email formats
- Secure password patterns
- Proper role assignments

**Product Data**:
- Realistic pricing and stock levels
- Valid SKU patterns
- Proper category associations
- Mix of sale and regular pricing

**Address Data**:
- Valid Indian pincode format
- Complete address information
- Proper phone number format

USAGE EXAMPLES:
```javascript
const { testUsers, testProducts, apiEndpoints } = require('./testData');

// Use test user for login
const response = await axios.post(
  `${apiEndpoints.base}${apiEndpoints.auth.login}`,
  testUsers.regularUser
);

// Use test products for cart operations
const product = testProducts.find(p => p.categorySlug === 'fruits');
```

TESTING BENEFITS:
- Consistent data across all tests
- Realistic test scenarios
- Easy to maintain and update
- Reduces test code duplication

SEED DATA INTEGRATION:
- Same data structure for seeding
- Consistent between test and seed environments
- Easy migration between environments

EXTENSIBILITY:
- Easy to add new test data sets
- Configurable for different environments
- Supports test data variations
- Compatible with data factories
*/

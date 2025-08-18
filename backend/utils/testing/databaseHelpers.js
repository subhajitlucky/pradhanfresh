/**
 * Database testing helpers
 * Functions for database operations and cleanup in test environments
 */

/**
 * Clear all test data from database
 * @param {Object} prisma - Prisma client instance
 */
const clearDatabase = async (prisma) => {
  console.log('🧹 Clearing test data...');
  
  try {
    // Clear in order to respect foreign key constraints
    await prisma.orderStatusHistory.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.address.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.user.deleteMany({});
    
    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
};

/**
 * Setup complete test database with all entities
 * @param {Object} prisma - Prisma client instance
 * @param {Object} testData - Complete test data object
 * @returns {Promise<Object>} Created entities
 */
const setupCompleteTestDatabase = async (prisma, testData = {}) => {
  const {
    categories: categoriesData,
    adminUser: adminData,
    testUser: userData,
    products: productsData
  } = testData;

  console.log('🚀 Setting up complete test database...');

  try {
    // Import helper functions
    const { seedCategories } = require('./categoryHelpers');
    const { seedAdminUser, seedTestUser } = require('./userHelpers');
    const { seedProducts } = require('./productHelpers');

    // Create categories
    const categories = await seedCategories(prisma, categoriesData);
    
    // Create users
    const adminUser = await seedAdminUser(prisma, adminData);
    const testUser = await seedTestUser(prisma, userData);
    
    // Create products
    const products = await seedProducts(prisma, productsData, adminUser, categories);

    console.log('✅ Test database setup completed');
    
    return {
      categories,
      adminUser,
      testUser,
      products
    };
    
  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    throw error;
  }
};

/**
 * Reset database to clean state for testing
 * @param {Object} prisma - Prisma client instance
 */
const resetDatabase = async (prisma) => {
  console.log('🔄 Resetting database for testing...');
  
  try {
    await clearDatabase(prisma);
    console.log('✅ Database reset completed');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  }
};

/**
 * Create test address for user
 * @param {Object} prisma - Prisma client instance
 * @param {number} userId - User ID to create address for
 * @param {Object} addressData - Address data
 * @returns {Promise<Object>} Created address
 */
const createTestAddress = async (prisma, userId, addressData = {}) => {
  const defaultAddress = {
    fullName: 'Test User',
    phone: '9876543210',
    addressLine1: 'Test Address Line 1',
    addressLine2: 'Test Address Line 2',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456',
    landmark: 'Test Landmark',
    isDefault: true,
    ...addressData
  };

  const address = await prisma.address.create({
    data: {
      userId,
      ...defaultAddress
    }
  });

  return address;
};

module.exports = {
  clearDatabase,
  setupCompleteTestDatabase,
  resetDatabase,
  createTestAddress
};

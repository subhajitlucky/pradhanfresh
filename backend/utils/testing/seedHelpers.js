/**
 * Testing Seed Helpers - Main module
 * Re-exports all testing helper functions from focused modules
 * 
 * This module provides a unified interface for all testing operations:
 * - Category management
 * - User management  
 * - Product management
 * - Database operations
 */

// Category helpers
const { seedCategories, getTestCategories } = require('./categoryHelpers');

// User helpers
const { seedAdminUser, seedTestUser, getDefaultAdmin, getDefaultTestUser } = require('./userHelpers');

// Product helpers
const { seedProducts, getTestProducts } = require('./productHelpers');

// Database helpers
const { clearDatabase, setupCompleteTestDatabase, resetDatabase, createTestAddress } = require('./databaseHelpers');

/**
 * Quick setup function for common test scenarios
 * Creates minimal test data (categories, admin, test user, few products)
 */
const quickTestSetup = async (prisma) => {
  console.log('⚡ Quick test setup starting...');
  
  const categories = await seedCategories(prisma, getTestCategories());
  const adminUser = await seedAdminUser(prisma, getDefaultAdmin());
  const testUser = await seedTestUser(prisma, getDefaultTestUser());
  const products = await seedProducts(prisma, getTestProducts(), adminUser, categories);
  
  console.log('✅ Quick test setup completed');
  
  return {
    categories,
    adminUser,
    testUser,
    products
  };
};

module.exports = {
  // Category operations
  seedCategories,
  getTestCategories,
  
  // User operations
  seedAdminUser,
  seedTestUser,
  getDefaultAdmin,
  getDefaultTestUser,
  
  // Product operations
  seedProducts,
  getTestProducts,
  
  // Database operations
  clearDatabase,
  setupCompleteTestDatabase,
  resetDatabase,
  createTestAddress,
  
  // Convenience functions
  quickTestSetup
};
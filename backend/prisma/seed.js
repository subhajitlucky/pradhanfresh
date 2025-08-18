/**
 * Database Seeding Script
 * Initializes the database with essential data for production and development
 * 
 * This script creates:
 * - Product categories (Fruits, Vegetables, Leafy Greens)
 * - Sample products with detailed information
 * - Admin and test user accounts
 * 
 * Usage: npm run seed
 */

const prisma = require('./client');
const { seedUsers } = require('./seedOperations/userSeeder');
const { seedCategories } = require('./seedOperations/categorySeeder');
const { seedProducts } = require('./seedOperations/productSeeder');

/**
 * Main seeding function
 * Orchestrates the entire database seeding process
 */
async function main() {
  console.log('🌱 Starting database seeding...\n');
  
  try {
    // Step 1: Create Users (Admin and Test users)
    const users = await seedUsers(prisma);
    const adminUser = users.find(user => user.role === 'ADMIN');
    
    if (!adminUser) {
      throw new Error('Admin user creation failed - cannot proceed with seeding');
    }
    
    // Step 2: Create Categories
    const categories = await seedCategories(prisma);
    
    if (categories.length === 0) {
      throw new Error('No categories created - cannot proceed with product seeding');
    }
    
    // Step 3: Create Products (requires categories and admin user)
    const products = await seedProducts(prisma, adminUser);
    
    // Summary
    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log('\n✨ Your PradhanFresh database is ready to use!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Execute seeding with proper error handling
 */
main()
  .catch((e) => {
    console.error('💥 Fatal seeding error:', e);
    process.exit(1);
  });

module.exports = main;
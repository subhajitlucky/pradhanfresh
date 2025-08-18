/**
 * Category seeding operations
 * Handles creation and management of product categories
 */

const { productionCategories } = require('../seedData/categories');

/**
 * Seed categories into database
 * Creates all product categories with proper validation
 */
const seedCategories = async (prisma) => {
  console.log('📦 Creating categories...');
  
  const createdCategories = [];
  
  for (const categoryData of productionCategories) {
    try {
      const category = await prisma.category.upsert({
        where: { slug: categoryData.slug },
        update: categoryData,
        create: categoryData
      });
      
      createdCategories.push(category);
      console.log(`   ✅ Created/Updated category: ${category.name}`);
    } catch (error) {
      console.error(`   ❌ Failed to create category ${categoryData.name}:`, error.message);
    }
  }
  
  console.log(`✅ Categories seeded successfully: ${createdCategories.length} categories\n`);
  return createdCategories;
};

module.exports = {
  seedCategories
};

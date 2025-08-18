/**
 * Category testing helpers
 * Functions for creating and managing categories in test environments
 */

/**
 * Create or update categories in database
 * @param {Object} prisma - Prisma client instance
 * @param {Array} categoriesData - Array of category objects
 * @returns {Promise<Array>} Created categories
 */
const seedCategories = async (prisma, categoriesData) => {
  console.log('Creating categories...');
  
  const categories = [];
  for (const categoryData of categoriesData) {
    const category = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: {},
      create: categoryData
    });
    categories.push(category);
  }
  
  console.log('✅ Categories created:', categories.map(c => c.name).join(', '));
  return categories;
};

/**
 * Get default test categories
 * @returns {Array} Default category data for testing
 */
const getTestCategories = () => {
  return [
    {
      name: 'Fruits',
      slug: 'fruits',
      description: 'Fresh fruits for testing',
      isActive: true
    },
    {
      name: 'Vegetables', 
      slug: 'vegetables',
      description: 'Fresh vegetables for testing',
      isActive: true
    },
    {
      name: 'Leafy Greens',
      slug: 'leafy-greens', 
      description: 'Leafy vegetables for testing',
      isActive: true
    }
  ];
};

module.exports = {
  seedCategories,
  getTestCategories
};

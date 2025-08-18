/**
 * Product testing helpers
 * Functions for creating and managing products in test environments
 */

/**
 * Create or update products in database
 * @param {Object} prisma - Prisma client instance
 * @param {Array} productsData - Array of product objects
 * @param {Object} adminUser - Admin user for product creation
 * @param {Array} categories - Available categories
 * @returns {Promise<Array>} Created products
 */
const seedProducts = async (prisma, productsData, adminUser, categories) => {
  console.log('Creating products...');
  
  const products = [];
  for (const productData of productsData) {
    // Find category by name or slug
    const category = categories.find(c => 
      c.slug === productData.categorySlug || c.name === productData.categoryName
    );
    
    if (!category) {
      console.log(`⚠️ Category not found for product: ${productData.name}`);
      continue;
    }

    const { categorySlug, categoryName, ...productCreateData } = productData;
    
    const product = await prisma.product.upsert({
      where: { sku: productCreateData.sku },
      update: {},
      create: {
        ...productCreateData,
        categoryId: category.id,
        createdById: adminUser.id,
        slug: productCreateData.name
          .toLowerCase()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/\s+/g, '-')
          .trim()
      }
    });
    
    products.push(product);
  }
  
  console.log('✅ Products created:', products.map(p => p.name).join(', '));
  return products;
};

/**
 * Get default test products
 * @returns {Array} Default product data for testing
 */
const getTestProducts = () => {
  return [
    {
      name: 'Test Apple',
      description: 'Test apple for testing purposes',
      shortDescription: 'Test apple',
      price: 100.00,
      salePrice: 80.00,
      thumbnail: '/test/apple.jpg',
      images: ['/test/apple.jpg'],
      stock: 50,
      sku: 'TEST-APPLE-001',
      unit: 'kg',
      weight: 1.0,
      isFeatured: true,
      isOrganic: false,
      categorySlug: 'fruits'
    },
    {
      name: 'Test Banana',
      description: 'Test banana for testing purposes',
      shortDescription: 'Test banana',
      price: 60.00,
      salePrice: 50.00,
      thumbnail: '/test/banana.jpg',
      images: ['/test/banana.jpg'],
      stock: 100,
      sku: 'TEST-BANANA-001',
      unit: 'dozen',
      weight: 1.2,
      isFeatured: false,
      isOrganic: true,
      categorySlug: 'fruits'
    },
    {
      name: 'Test Tomato',
      description: 'Test tomato for testing purposes',
      shortDescription: 'Test tomato',
      price: 70.00,
      salePrice: 60.00,
      thumbnail: '/test/tomato.jpg',
      images: ['/test/tomato.jpg'],
      stock: 75,
      sku: 'TEST-TOMATO-001',
      unit: 'kg',
      weight: 1.0,
      isFeatured: true,
      isOrganic: true,
      categorySlug: 'vegetables'
    }
  ];
};

module.exports = {
  seedProducts,
  getTestProducts
};

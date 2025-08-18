/**
 * Product seeding operations
 * Handles creation and management of product catalog
 */

const { productionProducts } = require('../seedData/products');

/**
 * Seed products into database
 * Creates all products with proper category associations
 */
const seedProducts = async (prisma, adminUser) => {
  console.log('🛍️  Creating products...');
  
  const createdProducts = [];
  
  for (const productData of productionProducts) {
    try {
      // Find category by slug
      const category = await prisma.category.findUnique({
        where: { slug: productData.categorySlug }
      });
      
      if (!category) {
        console.log(`   ⚠️  Category '${productData.categorySlug}' not found for product '${productData.name}', skipping...`);
        continue;
      }
      
      // Create product with category relationship
      const { categorySlug, ...productCreateData } = productData;
      
      const product = await prisma.product.upsert({
        where: { sku: productCreateData.sku },
        update: {
          ...productCreateData,
          categoryId: category.id,
          createdById: adminUser.id
        },
        create: {
          ...productCreateData,
          categoryId: category.id,
          createdById: adminUser.id,
          slug: productCreateData.name
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
        }
      });
      
      createdProducts.push(product);
      console.log(`   ✅ Created/Updated product: ${product.name} (${product.sku})`);
    } catch (error) {
      console.error(`   ❌ Failed to create product ${productData.name}:`, error.message);
    }
  }
  
  console.log(`✅ Products seeded successfully: ${createdProducts.length} products\n`);
  return createdProducts;
};

module.exports = {
  seedProducts
};

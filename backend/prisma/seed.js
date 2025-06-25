const prisma = require('./client');

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create categories first
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'fruits' },
      update: {},
      create: {
        name: 'Fruits',
        slug: 'fruits',
        description: 'Fresh seasonal fruits rich in vitamins and minerals',
        image: '/src/assets/images/fresh-fruits.jpg',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'vegetables' },
      update: {},
      create: {
        name: 'Vegetables',
        slug: 'vegetables',
        description: 'Organic vegetables for healthy living',
        image: '/src/assets/images/fresh-v.png',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'leafy-greens' },
      update: {},
      create: {
        name: 'Leafy Greens',
        slug: 'leafy-greens',
        description: 'Fresh leafy vegetables packed with nutrients',
        image: '/src/assets/images/organic.jpg',
      },
    }),
  ]);

  console.log('✅ Categories created:', categories.map(c => c.name));

  // Find an admin user to be the creator (or create one if doesn't exist)
  let adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@pradhanfresh.com',
        password: '$2b$10$hashedPasswordHere', // This should be properly hashed
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    console.log('✅ Admin user created');
  }

  // Create sample products
  const products = await Promise.all([
    // Fruits
    prisma.product.upsert({
      where: { slug: 'organic-apples' },
      update: {},
      create: {
        name: 'Organic Red Apples',
        slug: 'organic-apples',
        description: 'Crisp and sweet organic red apples, perfect for snacking or baking. Rich in fiber and vitamin C.',
        shortDescription: 'Crisp and sweet organic red apples',
        price: 4.99,
        salePrice: 3.99,
        categoryId: categories[0].id, // Fruits
        images: ['/src/assets/images/apple.jpg'],
        thumbnail: '/src/assets/images/apple.jpg',
        stock: 50,
        isAvailable: true,
        sku: 'FRU-APP-001',
        unit: 'kg',
        weight: 1000,
        isFeatured: true,
        isOrganic: true,
        createdById: adminUser.id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'fresh-bananas' },
      update: {},
      create: {
        name: 'Fresh Bananas',
        slug: 'fresh-bananas',
        description: 'Yellow ripe bananas, naturally sweet and packed with potassium. Great for smoothies and snacks.',
        shortDescription: 'Yellow ripe bananas, naturally sweet',
        price: 2.99,
        categoryId: categories[0].id, // Fruits
        images: ['/src/assets/images/banana.jpg'],
        thumbnail: '/src/assets/images/banana.jpg',
        stock: 75,
        isAvailable: true,
        sku: 'FRU-BAN-001',
        unit: 'kg',
        weight: 1000,
        isFeatured: false,
        isOrganic: false,
        createdById: adminUser.id,
      },
    }),
    
    // Vegetables
    prisma.product.upsert({
      where: { slug: 'organic-carrots' },
      update: {},
      create: {
        name: 'Organic Carrots',
        slug: 'organic-carrots',
        description: 'Fresh organic carrots, perfect for cooking, juicing, or eating raw. High in beta-carotene and vitamin A.',
        shortDescription: 'Fresh organic carrots, perfect for cooking',
        price: 3.49,
        categoryId: categories[1].id, // Vegetables
        images: ['/src/assets/images/carrot.jpg'],
        thumbnail: '/src/assets/images/carrot.jpg',
        stock: 30,
        isAvailable: true,
        sku: 'VEG-CAR-001',
        unit: 'kg',
        weight: 1000,
        isFeatured: true,
        isOrganic: true,
        createdById: adminUser.id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'fresh-broccoli' },
      update: {},
      create: {
        name: 'Fresh Broccoli',
        slug: 'fresh-broccoli',
        description: 'Green and nutritious broccoli florets. Rich in vitamins K, C, and fiber. Perfect for steaming or stir-frying.',
        shortDescription: 'Green and nutritious broccoli florets',
        price: 5.99,
        salePrice: 4.99,
        categoryId: categories[1].id, // Vegetables
        images: ['/src/assets/images/brocoli.jpg'],
        thumbnail: '/src/assets/images/brocoli.jpg',
        stock: 20,
        isAvailable: true,
        sku: 'VEG-BRO-001',
        unit: 'piece',
        weight: 500,
        isFeatured: false,
        isOrganic: false,
        createdById: adminUser.id,
      },
    }),

    // Leafy Greens (example with limited stock)
    prisma.product.upsert({
      where: { slug: 'organic-spinach' },
      update: {},
      create: {
        name: 'Organic Baby Spinach',
        slug: 'organic-spinach',
        description: 'Tender organic baby spinach leaves. Perfect for salads, smoothies, or cooking. High in iron and folate.',
        shortDescription: 'Tender organic baby spinach leaves',
        price: 6.99,
        categoryId: categories[2].id, // Leafy Greens
        images: ['/src/assets/images/fresh-v.png'],
        thumbnail: '/src/assets/images/fresh-v.png',
        stock: 5, // Low stock to test availability
        isAvailable: true,
        sku: 'LFY-SPI-001',
        unit: 'bunch',
        weight: 200,
        isFeatured: true,
        isOrganic: true,
        createdById: adminUser.id,
      },
    }),

    // Out of stock product
    prisma.product.upsert({
      where: { slug: 'premium-avocados' },
      update: {},
      create: {
        name: 'Premium Avocados',
        slug: 'premium-avocados',
        description: 'Creamy premium avocados, perfect for guacamole, toast, or salads. Rich in healthy fats and nutrients.',
        shortDescription: 'Creamy premium avocados',
        price: 8.99,
        categoryId: categories[0].id, // Fruits
        images: ['/src/assets/images/fresh-fruits.jpg'],
        thumbnail: '/src/assets/images/fresh-fruits.jpg',
        stock: 0, // Out of stock
        isAvailable: false,
        sku: 'FRU-AVO-001',
        unit: 'piece',
        weight: 200,
        isFeatured: false,
        isOrganic: true,
        createdById: adminUser.id,
      },
    }),
  ]);

  console.log('✅ Products created:', products.map(p => p.name));
  console.log('🌱 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
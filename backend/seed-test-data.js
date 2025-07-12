const { PrismaClient } = require('./generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedTestData() {
  console.log('🌱 Seeding test data...\n');

  try {
    // Create test categories
    console.log('1️⃣ Creating test categories...');
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { slug: 'fruits' },
        update: {},
        create: {
          name: 'Fruits',
          slug: 'fruits',
          description: 'Fresh seasonal fruits',
          image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400',
          isActive: true
        }
      }),
      prisma.category.upsert({
        where: { slug: 'vegetables' },
        update: {},
        create: {
          name: 'Vegetables',
          slug: 'vegetables',
          description: 'Fresh organic vegetables',
          image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
          isActive: true
        }
      })
    ]);
    console.log('✅ Categories created:', categories.map(c => c.name).join(', '));

    // Create test admin user
    console.log('\n2️⃣ Creating test admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@pradhanfresh.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@pradhanfresh.com',
        password: hashedPassword,
        role: 'ADMIN',
        isEmailVerified: true
      }
    });
    console.log('✅ Admin user created:', adminUser.email);

    // Create test products
    console.log('\n3️⃣ Creating test products...');
    const products = [
      {
        name: 'Fresh Apples',
        slug: 'fresh-apples',
        description: 'Crisp and juicy red apples, perfect for snacking or baking. Rich in fiber and vitamins.',
        shortDescription: 'Crisp and juicy red apples',
        price: 120.00,
        salePrice: 100.00,
        categoryId: categories[0].id, // Fruits
        images: [
          'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
          'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400'
        ],
        thumbnail: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
        stock: 50,
        isAvailable: true,
        sku: 'APPLE-001',
        unit: 'kg',
        weight: 1000,
        isFeatured: true,
        isOrganic: true,
        createdById: adminUser.id
      },
      {
        name: 'Organic Bananas',
        slug: 'organic-bananas',
        description: 'Sweet and ripe organic bananas, packed with potassium and natural energy.',
        shortDescription: 'Sweet and ripe organic bananas',
        price: 60.00,
        categoryId: categories[0].id, // Fruits
        images: [
          'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400'
        ],
        thumbnail: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400',
        stock: 30,
        isAvailable: true,
        sku: 'BANANA-001',
        unit: 'dozen',
        weight: 1200,
        isFeatured: false,
        isOrganic: true,
        createdById: adminUser.id
      },
      {
        name: 'Fresh Carrots',
        slug: 'fresh-carrots',
        description: 'Crunchy orange carrots, great for salads, cooking, and juicing. High in beta-carotene.',
        shortDescription: 'Crunchy orange carrots',
        price: 80.00,
        salePrice: 70.00,
        categoryId: categories[1].id, // Vegetables
        images: [
          'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=400'
        ],
        thumbnail: 'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=400',
        stock: 40,
        isAvailable: true,
        sku: 'CARROT-001',
        unit: 'kg',
        weight: 1000,
        isFeatured: true,
        isOrganic: false,
        createdById: adminUser.id
      },
      {
        name: 'Organic Spinach',
        slug: 'organic-spinach',
        description: 'Fresh leafy green spinach, perfect for salads and cooking. Rich in iron and vitamins.',
        shortDescription: 'Fresh leafy green spinach',
        price: 40.00,
        categoryId: categories[1].id, // Vegetables
        images: [
          'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400'
        ],
        thumbnail: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
        stock: 25,
        isAvailable: true,
        sku: 'SPINACH-001',
        unit: 'bunch',
        weight: 250,
        isFeatured: false,
        isOrganic: true,
        createdById: adminUser.id
      },
      {
        name: 'Fresh Tomatoes',
        slug: 'fresh-tomatoes',
        description: 'Juicy red tomatoes, perfect for salads, cooking, and sauces. Vine-ripened for best flavor.',
        shortDescription: 'Juicy red tomatoes',
        price: 90.00,
        categoryId: categories[1].id, // Vegetables
        images: [
          'https://images.unsplash.com/photo-1546470427-227e42d0d4c5?w=400'
        ],
        thumbnail: 'https://images.unsplash.com/photo-1546470427-227e42d0d4c5?w=400',
        stock: 35,
        isAvailable: true,
        sku: 'TOMATO-001',
        unit: 'kg',
        weight: 1000,
        isFeatured: true,
        isOrganic: false,
        createdById: adminUser.id
      }
    ];

    for (const productData of products) {
      const product = await prisma.product.upsert({
        where: { slug: productData.slug },
        update: {},
        create: productData
      });
      console.log(`✅ Created product: ${product.name} (₹${product.price})`);
    }

    // Create test regular user (for cart testing)
    console.log('\n4️⃣ Creating test regular user...');
    const testUserPassword = await bcrypt.hash('password123', 10);
    const testUser = await prisma.user.upsert({
      where: { email: 'carttest@example.com' },
      update: {},
      create: {
        name: 'Cart Test User',
        email: 'carttest@example.com',
        password: testUserPassword,
        role: 'USER',
        isEmailVerified: true // Skip email verification for testing
      }
    });
    console.log('✅ Test user created:', testUser.email);

    console.log('\n🎉 Test data seeded successfully!');
    console.log('\nTest credentials:');
    console.log('Admin: admin@pradhanfresh.com / admin123');
    console.log('User: carttest@example.com / password123');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData(); 
/**
 * User seeding operations
 * Handles creation and management of system users
 */

const { createProductionUsers } = require('../seedData/users');

/**
 * Seed users into database
 * Creates admin and test users for system operation
 */
const seedUsers = async (prisma) => {
  console.log('👥 Creating users...');
  
  const userData = await createProductionUsers();
  const createdUsers = [];
  
  for (const user of userData) {
    try {
      const createdUser = await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          role: user.role,
          isEmailVerified: user.isEmailVerified
          // Don't update password on existing users
        },
        create: user
      });
      
      createdUsers.push(createdUser);
      console.log(`   ✅ Created/Updated user: ${createdUser.name} (${createdUser.email}) - Role: ${createdUser.role}`);
    } catch (error) {
      console.error(`   ❌ Failed to create user ${user.email}:`, error.message);
    }
  }
  
  console.log(`✅ Users seeded successfully: ${createdUsers.length} users\n`);
  return createdUsers;
};

module.exports = {
  seedUsers
};

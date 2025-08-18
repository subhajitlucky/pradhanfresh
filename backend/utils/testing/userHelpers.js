/**
 * User testing helpers
 * Functions for creating and managing users in test environments
 */

const bcrypt = require('bcrypt');

/**
 * Create or update admin user
 * @param {Object} prisma - Prisma client instance
 * @param {Object} adminData - Admin user data
 * @returns {Promise<Object>} Created admin user
 */
const seedAdminUser = async (prisma, adminData) => {
  console.log('Creating admin user...');
  
  const hashedPassword = await bcrypt.hash(adminData.password, 10);
  const adminUser = await prisma.user.upsert({
    where: { email: adminData.email },
    update: {},
    create: {
      name: adminData.name,
      email: adminData.email,
      password: hashedPassword,
      role: 'ADMIN',
      isEmailVerified: true
    }
  });
  
  console.log('✅ Admin user created:', adminUser.email);
  return adminUser;
};

/**
 * Create or update test user
 * @param {Object} prisma - Prisma client instance  
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
const seedTestUser = async (prisma, userData) => {
  console.log('Creating test user...');
  
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const user = await prisma.user.upsert({
    where: { email: userData.email },
    update: {},
    create: {
      name: userData.name,
      email: userData.email, 
      password: hashedPassword,
      role: 'USER',
      isEmailVerified: true
    }
  });
  
  console.log('✅ Test user created:', user.email);
  return user;
};

/**
 * Get default admin user data
 * @returns {Object} Default admin user for testing
 */
const getDefaultAdmin = () => {
  return {
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'admin123'
  };
};

/**
 * Get default test user data
 * @returns {Object} Default test user
 */
const getDefaultTestUser = () => {
  return {
    name: 'Test User',
    email: 'user@test.com', 
    password: 'user123'
  };
};

module.exports = {
  seedAdminUser,
  seedTestUser,
  getDefaultAdmin,
  getDefaultTestUser
};

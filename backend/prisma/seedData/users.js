/**
 * User seed data for database initialization
 * Contains default admin and test users for development
 */

const bcrypt = require('bcrypt');

/**
 * Create production-ready user accounts
 * Admin account for system management and test user for development
 */
const createProductionUsers = async () => {
  const saltRounds = 10;
  
  return [
    {
      name: 'Administrator',
      email: 'admin@pradhanfresh.com',
      password: await bcrypt.hash('admin123', saltRounds),
      role: 'ADMIN',
      isEmailVerified: true
    },
    {
      name: 'Test User',
      email: 'user@test.com',
      password: await bcrypt.hash('user123', saltRounds),
      role: 'USER',
      isEmailVerified: true
    }
  ];
};

module.exports = {
  createProductionUsers
};

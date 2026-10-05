// Truncates all tables before the test run so re-runs never hit
// unique-constraint leftovers from a previously crashed suite.
// SAFETY: refuses to run unless DATABASE_URL points at localhost.
require('dotenv').config();
const { PrismaClient } = require('../generated/prisma');

module.exports = async () => {
  const url = process.env.DATABASE_URL || '';
  if (!/localhost|127\.0\.0\.1/.test(url)) {
    throw new Error(
      `Refusing to truncate a non-local database (DATABASE_URL=${url}). ` +
        'Point DATABASE_URL at a local test database to run the suite.'
    );
  }
  const prisma = new PrismaClient();
  await prisma.$executeRawUnsafe(
    'TRUNCATE "WishlistItem","Wishlist","CartItem","Cart","OrderItem",' +
      '"OrderStatusHistory","Order","Address","Product","Category","User" ' +
      'RESTART IDENTITY CASCADE;'
  );
  await prisma.$disconnect();
};

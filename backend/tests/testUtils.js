const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

// Truncate all tables so each test file starts from a clean database.
// SAFETY: refuses to run unless DATABASE_URL points at localhost.
async function resetDb() {
  const url = process.env.DATABASE_URL || '';
  if (!/localhost|127\.0\.0\.1/.test(url)) {
    throw new Error(
      `Refusing to truncate a non-local database (DATABASE_URL=${url}). ` +
        'Point DATABASE_URL at a local test database to run the suite.'
    );
  }
  await prisma.$executeRawUnsafe(
    'TRUNCATE "WishlistItem","Wishlist","CartItem","Cart","OrderItem",' +
      '"OrderStatusHistory","Order","Address","Product","Category","User" ' +
      'RESTART IDENTITY CASCADE;'
  );
}

module.exports = { resetDb, prisma };

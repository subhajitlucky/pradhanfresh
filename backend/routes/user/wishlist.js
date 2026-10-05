const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');

/**
 * Get (or lazily create) the single wishlist belonging to a user.
 */
const getOrCreateWishlist = async (userId) => {
  const existing = await prisma.wishlist.findUnique({ where: { userId } });
  if (existing) return existing;
  // Concurrent first requests can race; a duplicate key here is harmless.
  return prisma.wishlist.create({ data: { userId } }).catch(() =>
    prisma.wishlist.findUnique({ where: { userId } }),
  );
};

/**
 * Resolves a wishlist item by product id so routes can accept the product the
 * customer thinks about rather than a database id they never see.
 */
const findItemByProduct = async (userId, productId) => {
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) return null;
  return prisma.wishlistItem.findFirst({ where: { wishlistId: wishlist.id, productId } });
};

const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  thumbnail: true,
  price: true,
  salePrice: true,
  unit: true,
  stock: true,
  isAvailable: true,
  category: { select: { id: true, name: true, slug: true } },
};

// GET /api/user/wishlist - List saved products, newest first
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const items = await prisma.wishlistItem.findMany({
      where: { wishlist: { userId } },
      include: { product: { select: PRODUCT_SELECT } },
      orderBy: { addedAt: 'desc' },
    });

    res.json({
      success: true,
      message: items.length ? 'Wishlist retrieved' : 'Your wishlist is empty',
      data: items,
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
  }
});

// POST /api/user/wishlist/add - Save a product. Idempotent.
router.post('/add', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const productId = Number(req.body?.productId);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid productId is required',
        error: 'Validation Error',
      });
    }

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found', error: 'Not Found' });
    }

    const wishlist = await getOrCreateWishlist(userId);
    const existing = await prisma.wishlistItem.findFirst({
      where: { wishlistId: wishlist.id, productId },
    });
    if (existing) {
      return res.json({ success: true, message: 'Already on your wishlist', data: existing });
    }

    const item = await prisma.wishlistItem.create({
      data: { wishlistId: wishlist.id, productId },
      include: { product: { select: PRODUCT_SELECT } },
    });

    res.status(201).json({ success: true, message: 'Added to wishlist', data: item });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ success: false, message: 'Failed to add to wishlist' });
  }
});

// DELETE /api/user/wishlist/:productId - Remove a saved product
router.delete('/:productId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const productId = Number(req.params.productId);

    const item = await findItemByProduct(userId, productId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Not on your wishlist', error: 'Not Found' });
    }

    await prisma.wishlistItem.delete({ where: { id: item.id } });
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ success: false, message: 'Failed to remove from wishlist' });
  }
});

module.exports = router;
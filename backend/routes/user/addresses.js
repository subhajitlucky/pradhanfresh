const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');

// GET /api/user/addresses - Get all addresses for user
router.get('/', requireAuth, async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch addresses' });
  }
});

// POST /api/user/addresses - Create new address
router.post('/', requireAuth, async (req, res) => {
  try {
    const address = await prisma.address.create({
      data: {
        ...req.body,
        userId: req.user.userId
      }
    });
    res.json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create address' });
  }
});

// DELETE /api/user/addresses/:id - Delete address
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await prisma.address.delete({
      where: { 
        id: parseInt(req.params.id),
        userId: req.user.userId 
      }
    });
    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete address' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');
const { validateAddress, validateAddressId } = require('../../utils/user/validation');

/** Only these columns are ever taken from the request body. */
const ADDRESS_FIELDS = [
  'fullName',
  'phone',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'pincode',
  'landmark',
];

function pickAddressFields(body = {}) {
  const out = {};
  for (const key of ADDRESS_FIELDS) {
    if (body[key] !== undefined) {
      out[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
    }
  }
  return out;
}

/**
 * Loads an address and asserts ownership.
 * Returns null when it does not exist or belongs to somebody else, so callers
 * cannot use this endpoint to probe for other customers' addresses.
 */
async function findOwnedAddress(id, userId) {
  return prisma.address.findFirst({ where: { id, userId } });
}

// GET /api/user/address - Get all addresses for the signed-in user
router.get('/', requireAuth, async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({
      success: true,
      message: addresses.length ? 'Addresses retrieved' : 'No saved addresses yet',
      data: addresses,
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch addresses' });
  }
});

// POST /api/user/address - Create a new address
router.post('/', requireAuth, async (req, res) => {
  try {
    const payload = pickAddressFields(req.body);

    // Previously unvalidated: a missing field produced a Prisma error and a
    // 500 instead of a 400, so the client could never tell what was wrong.
    const validation = validateAddress(payload);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        error: validation.error || 'Validation Error',
      });
    }

    // Only one default address per user.
    if (payload.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: { ...payload, userId: req.user.userId },
    });

    res.status(201).json({ success: true, message: 'Address created', data: address });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({ success: false, message: 'Failed to create address' });
  }
});

// PUT /api/user/address/:id - Update an address
// This route was unreachable: routes/user/index.js mounted ./addresses, so
// ./address.js (which holds the update handler) was never registered.
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const idCheck = validateAddressId(req.params.id);
    if (!idCheck.valid) {
      return res.status(400).json({
        success: false,
        message: idCheck.message,
        error: idCheck.error || 'Validation Error',
      });
    }
    const { addressId } = idCheck.data;

    const existing = await findOwnedAddress(addressId, req.user.userId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const payload = pickAddressFields(req.body);
    const merged = { ...existing, ...payload };
    const validation = validateAddress(merged);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        error: validation.error || 'Validation Error',
      });
    }

    if (payload.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.userId, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id: addressId },
      data: payload,
    });

    res.json({ success: true, message: 'Address updated', data: address });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ success: false, message: 'Failed to update address' });
  }
});

// DELETE /api/user/address/:id - Delete an address
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const idCheck = validateAddressId(req.params.id);
    if (!idCheck.valid) {
      return res.status(400).json({
        success: false,
        message: idCheck.message,
        error: idCheck.error || 'Validation Error',
      });
    }
    const { addressId } = idCheck.data;

    // prisma.address.delete() only accepts a unique where; passing {id, userId}
    // together threw, which is why every delete returned 500.
    const { count } = await prisma.address.deleteMany({
      where: { id: addressId, userId: req.user.userId },
    });

    if (count === 0) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ success: false, message: 'Failed to delete address' });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');

// POST /api/user/address - Add a new address
router.post('/', async (req, res) => {
  try {
    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      landmark,
      isDefault
    } = req.body;
    const userId = req.user.userId;

    const requiredFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`,
          error: 'Validation Error'
        });
      }
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId,
        fullName,
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        landmark,
        isDefault: isDefault || false
      }
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: newAddress
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add address',
      error: 'Internal Server Error'
    });
  }
});

// GET /api/user/address - Get all addresses for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: {
        isDefault: 'desc',
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Addresses retrieved successfully',
      data: addresses
    });
  } catch (error) {
    console.error('Error retrieving addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve addresses',
      error: 'Internal Server Error'
    });
  }
});

// PUT /api/user/address/:id - Update an address
router.put('/:id', async (req, res) => {
  try {
    const addressId = parseInt(req.params.id);
    if (isNaN(addressId)) {
      return res.status(400).json({ success: false, message: 'Invalid address ID' });
    }

    const { isDefault } = req.body;
    const userId = req.user.userId;

    const address = await prisma.address.findUnique({
      where: { id: addressId }
    });

    if (!address || address.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Address not found or access denied' });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: req.body
    });

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: updatedAddress
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address',
      error: 'Internal Server Error'
    });
  }
});

// DELETE /api/user/address/:id - Delete an address
router.delete('/:id', async (req, res) => {
  try {
    const addressId = parseInt(req.params.id);
    if (isNaN(addressId)) {
      return res.status(400).json({ success: false, message: 'Invalid address ID' });
    }

    const userId = req.user.userId;

    const address = await prisma.address.findUnique({
      where: { id: addressId }
    });

    if (!address || address.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Address not found or access denied' });
    }

    // Prevent deleting the last address if it's the default
    if (address.isDefault) {
      const addressCount = await prisma.address.count({
        where: { userId }
      });
      if (addressCount === 1) {
        return res.status(400).json({ success: false, message: 'Cannot delete the only default address. Set another address as default first.' });
      }
    }

    await prisma.address.delete({
      where: { id: addressId }
    });

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete address',
      error: 'Internal Server Error'
    });
  }
});

module.exports = router; 
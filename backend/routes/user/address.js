const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const { validateAddress, validateAddressId } = require('../../utils/user/validation');
const { addUserAddress, getUserAddresses, updateUserAddress, deleteUserAddress } = require('../../utils/user/operations');

// Apply authentication middleware to all routes
router.use(requireAuth);

// POST /api/user/address - Add a new address
router.post('/', async (req, res) => {
  try {
    const userId = req.user.userId;

    const validation = validateAddress(req.body);
    if (!validation.valid) {
      return res.status(400).json(validation);
    }

    const newAddress = await addUserAddress(userId, req.body);

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

// GET /api/user/address - Get all user addresses
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const addresses = await getUserAddresses(userId);

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
    const userId = req.user.userId;

    const idValidation = validateAddressId(req.params.id);
    if (!idValidation.valid) {
      return res.status(400).json(idValidation);
    }

    const { addressId } = idValidation.data;

    // Validate update data if provided
    if (Object.keys(req.body).some(key => ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'].includes(key))) {
      const validation = validateAddress(req.body);
      if (!validation.valid) {
        return res.status(400).json(validation);
      }
    }

    const updatedAddress = await updateUserAddress(addressId, userId, req.body);

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: updatedAddress
    });

  } catch (error) {
    console.error('Error updating address:', error);
    
    if (error.message === 'Address not found or access denied') {
      return res.status(404).json({
        success: false,
        message: 'Address not found or access denied',
        error: 'Not Found'
      });
    }

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
    const userId = req.user.userId;

    const idValidation = validateAddressId(req.params.id);
    if (!idValidation.valid) {
      return res.status(400).json(idValidation);
    }

    const { addressId } = idValidation.data;

    await deleteUserAddress(addressId, userId);

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting address:', error);
    
    if (error.message === 'Address not found or access denied') {
      return res.status(404).json({
        success: false,
        message: 'Address not found or access denied',
        error: 'Not Found'
      });
    }

    if (error.message.includes('Cannot delete the only default address')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'Business Rule Violation'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete address',
      error: 'Internal Server Error'
    });
  }
});

module.exports = router;
const prisma = require('../../prisma/client');

/**
 * Add new address for user
 */
const addUserAddress = async (userId, addressData) => {
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
  } = addressData;

  return await prisma.$transaction(async (prisma) => {
    // If this is being set as default, remove default from other addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    // Create new address
    const newAddress = await prisma.address.create({
      data: {
        userId,
        fullName: fullName.trim(),
        phone: phone.toString().replace(/\D/g, ''), // Store only digits
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2?.trim() || null,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.toString(),
        landmark: landmark?.trim() || null,
        isDefault: isDefault || false
      }
    });

    return newAddress;
  });
};

/**
 * Get all addresses for user
 */
const getUserAddresses = async (userId) => {
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [
      { isDefault: 'desc' }, // Default addresses first
      { createdAt: 'desc' }   // Then by creation date
    ]
  });

  return addresses;
};

/**
 * Update user address
 */
const updateUserAddress = async (addressId, userId, updateData) => {
  return await prisma.$transaction(async (prisma) => {
    // Verify address ownership
    const address = await prisma.address.findUnique({
      where: { id: addressId }
    });

    if (!address || address.userId !== userId) {
      throw new Error('Address not found or access denied');
    }

    // If setting as default, remove default from other addresses
    if (updateData.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    // Clean and prepare update data
    const cleanUpdateData = {};
    if (updateData.fullName) cleanUpdateData.fullName = updateData.fullName.trim();
    if (updateData.phone) cleanUpdateData.phone = updateData.phone.toString().replace(/\D/g, '');
    if (updateData.addressLine1) cleanUpdateData.addressLine1 = updateData.addressLine1.trim();
    if (updateData.addressLine2 !== undefined) cleanUpdateData.addressLine2 = updateData.addressLine2?.trim() || null;
    if (updateData.city) cleanUpdateData.city = updateData.city.trim();
    if (updateData.state) cleanUpdateData.state = updateData.state.trim();
    if (updateData.pincode) cleanUpdateData.pincode = updateData.pincode.toString();
    if (updateData.landmark !== undefined) cleanUpdateData.landmark = updateData.landmark?.trim() || null;
    if (updateData.isDefault !== undefined) cleanUpdateData.isDefault = Boolean(updateData.isDefault);

    // Update address
    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: cleanUpdateData
    });

    return updatedAddress;
  });
};

/**
 * Delete user address
 */
const deleteUserAddress = async (addressId, userId) => {
  return await prisma.$transaction(async (prisma) => {
    // Verify address ownership
    const address = await prisma.address.findUnique({
      where: { id: addressId }
    });

    if (!address || address.userId !== userId) {
      throw new Error('Address not found or access denied');
    }

    // Check if this is the last default address
    if (address.isDefault) {
      const addressCount = await prisma.address.count({
        where: { userId }
      });

      if (addressCount === 1) {
        throw new Error('Cannot delete the only default address. Set another address as default first.');
      }
    }

    // Delete address
    await prisma.address.delete({
      where: { id: addressId }
    });
  });
};

module.exports = {
  addUserAddress,
  getUserAddresses,
  updateUserAddress,
  deleteUserAddress
};

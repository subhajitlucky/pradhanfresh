const prisma = require('../../prisma/client');
const bcrypt = require('bcrypt');

/**
 * Get user profile data
 */
const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isEmailVerified: true,
      createdAt: true
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Update user profile name
 */
const updateUserProfile = async (userId, name) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { name: name.trim() },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isEmailVerified: true,
      createdAt: true
    }
  });

  return updatedUser;
};

/**
 * Change user password
 */
const changeUserPassword = async (userId, currentPassword, newPassword) => {
  // Get user with password for verification
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new Error('Incorrect current password');
  }

  // Hash new password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changeUserPassword
};

// Re-export all user operations from focused modules
const { getUserProfile, updateUserProfile, changeUserPassword } = require('./profileOperations');
const { addUserAddress, getUserAddresses, updateUserAddress, deleteUserAddress } = require('./addressOperations');

module.exports = {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  addUserAddress,
  getUserAddresses,
  updateUserAddress,
  deleteUserAddress
};
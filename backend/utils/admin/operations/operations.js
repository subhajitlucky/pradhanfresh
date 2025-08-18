// Re-export all admin operations from focused modules
const { getUsers, getUserDetails, updateUserRole } = require('./userOperations');
const { createCategory, updateCategory, deleteCategory, getCategories } = require('./categoryOperations');

module.exports = {
  getUsers,
  getUserDetails,
  updateUserRole,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories
};
// Re-export all category handlers from focused modules
const { handleCreateCategory } = require('./createHandler');
const { handleUpdateCategory } = require('./updateHandler');
const { handleDeleteCategory } = require('./deleteHandler');
const { handleGetCategories } = require('./getHandler');

module.exports = {
  handleCreateCategory,
  handleUpdateCategory,
  handleDeleteCategory,
  handleGetCategories
};

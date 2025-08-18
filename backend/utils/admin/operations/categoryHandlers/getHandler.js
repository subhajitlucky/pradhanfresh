/**
 * Category retrieval handler
 * Handles fetching all categories with error handling
 */

const { getCategories } = require('../operations');

/**
 * Handle getting all categories
 */
const handleGetCategories = async (req, res) => {
  try {
    const categories = await getCategories();

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: {
        categories: categories
      }
    });

  } catch (error) {
    console.error('Error fetching admin categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: 'Internal Server Error'
    });
  }
};

module.exports = {
  handleGetCategories
};

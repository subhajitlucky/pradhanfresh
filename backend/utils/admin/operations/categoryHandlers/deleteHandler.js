/**
 * Category deletion handler
 * Handles deleting categories with validation and error handling
 */

const { validateCategoryId } = require('../../validation/validation');
const { deleteCategory } = require('../operations');

/**
 * Handle deleting a category
 */
const handleDeleteCategory = async (req, res) => {
  try {
    const idValidation = validateCategoryId(req.params.id);
    if (!idValidation.valid) {
      return res.status(400).json(idValidation);
    }

    const { categoryId } = idValidation.data;

    const deletedCategory = await deleteCategory(categoryId);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: {
        deletedCategory: {
          id: deletedCategory.id,
          name: deletedCategory.name,
          slug: deletedCategory.slug
        }
      }
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    
    if (error.message === 'Category not found') {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: 'Not Found'
      });
    }

    if (error.message.includes('cannot be deleted')) {
      return res.status(409).json({
        success: false,
        message: error.message,
        error: 'Constraint Violation'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: 'Internal Server Error'
    });
  }
};

module.exports = {
  handleDeleteCategory
};

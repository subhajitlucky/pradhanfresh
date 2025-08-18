/**
 * Category update handler
 * Handles updating existing categories with validation and error handling
 */

const { validateCategoryId, validateCategoryUpdate } = require('../../validation/validation');
const { updateCategory } = require('../operations');

/**
 * Handle updating a category
 */
const handleUpdateCategory = async (req, res) => {
  try {
    const idValidation = validateCategoryId(req.params.id);
    if (!idValidation.valid) {
      return res.status(400).json(idValidation);
    }

    const { categoryId } = idValidation.data;

    const updateValidation = validateCategoryUpdate(req.body);
    if (!updateValidation.valid) {
      return res.status(400).json(updateValidation);
    }

    const updatedCategory = await updateCategory(categoryId, updateValidation.data);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });

  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error.message === 'Category not found') {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: 'Not Found'
      });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Category with this name or slug already exists',
        error: 'Conflict'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: 'Internal Server Error'
    });
  }
};

module.exports = {
  handleUpdateCategory
};

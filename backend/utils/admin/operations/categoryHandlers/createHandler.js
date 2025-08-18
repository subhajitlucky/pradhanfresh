/**
 * Category creation handler
 * Handles creating new categories with validation and error handling
 */

const { validateCategory } = require('../../validation/validation');
const { createCategory } = require('../operations');

/**
 * Handle creating a new category
 */
const handleCreateCategory = async (req, res) => {
  try {
    const validation = validateCategory(req.body);
    if (!validation.valid) {
      return res.status(400).json(validation);
    }

    const newCategory = await createCategory(validation.data);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });

  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Category with this name or slug already exists',
        error: 'Conflict'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: 'Internal Server Error'
    });
  }
};

module.exports = {
  handleCreateCategory
};

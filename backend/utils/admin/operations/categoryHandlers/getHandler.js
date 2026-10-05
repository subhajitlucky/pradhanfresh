/**
 * Category retrieval handler
 * Handles fetching all categories with error handling
 */

const { getCategories } = require('../operations');
const { validatePaginationParams } = require('../../validation/validation');

/**
 * Handle getting all categories
 */
const handleGetCategories = async (req, res) => {
  try {
    const hasPaging = req.query.page !== undefined || req.query.limit !== undefined;
    let page;
    let limit;
    let skip;
    if (hasPaging) {
      const paginationValidation = validatePaginationParams(req.query);
      if (!paginationValidation.valid) {
        return res.status(400).json({ success: false, ...paginationValidation });
      }
      ({ page, limit, skip } = paginationValidation.data);
    }
    const search = req.query.search || '';

    const result = await getCategories({ page, limit, skip, search });

    if (Array.isArray(result)) {
      return res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: {
          categories: result
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: {
        categories: result.categories,
        pagination: result.pagination
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

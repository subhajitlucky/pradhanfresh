const express = require('express');
const router = express.Router();
const requireAuth = require('../../../middleware/requireAuth');
const requireAdmin = require('../../../middleware/requireAdmin');
const { 
  handleCreateCategory, 
  handleUpdateCategory, 
  handleDeleteCategory, 
  handleGetCategories 
} = require('../../../utils/admin/operations/categoryHandlers/categoryHandlers');

// Apply middleware to all routes
router.use(requireAuth, requireAdmin);

// POST /api/admin/categories - Create a new category
router.post('/', handleCreateCategory);

// PUT /api/admin/categories/:id - Update a category
router.put('/:id', handleUpdateCategory);

// DELETE /api/admin/categories/:id - Delete a category
router.delete('/:id', handleDeleteCategory);

// GET /api/admin/categories - Get all categories for admin
router.get('/', handleGetCategories);

module.exports = router;
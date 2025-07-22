const express = require('express');
const router = express.Router();
const prisma = require('../../../prisma/client');

// POST /api/admin/categories - Create a new category
router.post('/', async (req, res) => {
  try {
    const { name, description, image, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    let finalSlug = slug;
    let slugCounter = 1;
    while (await prisma.category.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${slugCounter}`;
      slugCounter++;
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug: finalSlug,
        description,
        image,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
});

// PUT /api/admin/categories/:id - Update a category
router.put('/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    const { name, description, image, isActive } = req.body;
    const updateData = {};

    if (name) {
      updateData.name = name;
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      let finalSlug = slug;
      let slugCounter = 1;
      while (true) {
        const slugExists = await prisma.category.findUnique({ where: { slug: finalSlug } });
        if (!slugExists || slugExists.id === categoryId) {
          break;
        }
        finalSlug = `${slug}-${slugCounter}`;
        slugCounter++;
      }
      updateData.slug = finalSlug;
    }

    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
});

// DELETE /api/admin/categories/:id - Delete a category
router.delete('/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    const productCount = await prisma.product.count({
      where: { categoryId: categoryId }
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: ${productCount} products are still associated with it.`
      });
    }

    await prisma.category.delete({
      where: { id: categoryId }
    });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
});

// GET /api/admin/categories - Get all categories for admin
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const categoriesWithCounts = categories.map(category => ({
      ...category,
      productCount: category._count.products,
    }));

    res.status(200).json({
      success: true,
      message: 'Admin categories retrieved successfully',
      data: categoriesWithCounts
    });
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories for admin' });
  }
});

module.exports = router; 
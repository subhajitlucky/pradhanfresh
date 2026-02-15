const prisma = require('../../../prisma/client');

/**
 * Create new category with unique slug
 */
const createCategory = async (categoryData) => {
  const { name, description, image, isActive } = categoryData;

  // Generate slug from name
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  // Ensure slug uniqueness
  let finalSlug = baseSlug;
  let slugCounter = 1;
  while (await prisma.category.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${baseSlug}-${slugCounter}`;
    slugCounter++;
  }

  const newCategory = await prisma.category.create({
    data: {
      name,
      slug: finalSlug,
      description,
      image,
      isActive
    }
  });

  return newCategory;
};

/**
 * Update category
 */
const updateCategory = async (categoryId, updateData) => {
  // Check if category exists
  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId }
  });

  if (!existingCategory) {
    throw new Error('Category not found');
  }

  // Handle slug regeneration if name is changing
  if (updateData.name && updateData.name !== existingCategory.name) {
    const baseSlug = updateData.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Ensure slug uniqueness (excluding current category)
    let finalSlug = baseSlug;
    let slugCounter = 1;
    while (true) {
      const existingSlug = await prisma.category.findUnique({ 
        where: { slug: finalSlug } 
      });
      
      if (!existingSlug || existingSlug.id === categoryId) {
        break;
      }
      
      finalSlug = `${baseSlug}-${slugCounter}`;
      slugCounter++;
    }

    updateData.slug = finalSlug;
  }

  const updatedCategory = await prisma.category.update({
    where: { id: categoryId },
    data: updateData
  });

  return updatedCategory;
};

/**
 * Delete category (with product count check)
 */
const deleteCategory = async (categoryId) => {
  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId }
  });

  if (!category) {
    throw new Error('Category not found');
  }

  // Check for associated products
  const productCount = await prisma.product.count({
    where: { categoryId: categoryId }
  });

  if (productCount > 0) {
    throw new Error(`Cannot delete category: ${productCount} products are still associated with it`);
  }

  await prisma.category.delete({
    where: { id: categoryId }
  });
};

/**
 * Get all categories for admin with product counts
 */
const getCategories = async () => {
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

  return categoriesWithCounts;
};

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories
};

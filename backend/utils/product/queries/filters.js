/**
 * Build where clause for product filtering
 * @param {Object} filters - Filter parameters
 * @returns {Object} Prisma where clause
 */
const buildWhereClause = (filters) => {
  const {
    search,
    categoryIds,
    minPrice,
    maxPrice,
    isOrganic,
    isFeatured,
    isAvailable = true
  } = filters;

  const whereClause = {
    isAvailable: isAvailable,
  };

  // Add search functionality
  if (search && search.trim()) {
    whereClause.OR = [
      {
        name: {
          contains: search.trim(),
          mode: 'insensitive'
        }
      },
      {
        description: {
          contains: search.trim(),
          mode: 'insensitive'
        }
      },
      {
        shortDescription: {
          contains: search.trim(),
          mode: 'insensitive'
        }
      },
      {
        category: {
          name: {
            contains: search.trim(),
            mode: 'insensitive'
          }
        }
      }
    ];
  }

  // Add category filter
  if (categoryIds && categoryIds.length > 0) {
    whereClause.categoryId = {
      in: categoryIds
    };
  }

  // Add price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    whereClause.salePrice = {};
    
    if (minPrice !== undefined && minPrice >= 0) {
      whereClause.salePrice.gte = minPrice;
    }
    
    if (maxPrice !== undefined && maxPrice >= 0) {
      whereClause.salePrice.lte = maxPrice;
    }
  }

  // Add organic filter
  if (isOrganic !== undefined) {
    whereClause.isOrganic = isOrganic;
  }

  // Add featured filter
  if (isFeatured !== undefined) {
    whereClause.isFeatured = isFeatured;
  }

  return whereClause;
};

module.exports = {
  buildWhereClause
};

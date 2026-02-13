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
    // If minPrice is set, we want products where (salePrice >= minPrice) OR (salePrice is NULL AND price >= minPrice)
    // However, Prisma doesn't support complex OR conditions within a single field well in a clean way for price ranges.
    // A better approach for simple e-commerce is to ensure salePrice defaults to price if not set, 
    // but here we have to work with the schema where salePrice is optional.
    
    // Most robust way in Prisma for this schema:
    whereClause.AND = whereClause.AND || [];
    
    if (minPrice !== undefined && minPrice >= 0) {
      whereClause.AND.push({
        OR: [
          { salePrice: { gte: minPrice } },
          { AND: [{ salePrice: null }, { price: { gte: minPrice } }] }
        ]
      });
    }
    
    if (maxPrice !== undefined && maxPrice >= 0) {
      whereClause.AND.push({
        OR: [
          { salePrice: { lte: maxPrice } },
          { AND: [{ salePrice: null }, { price: { lte: maxPrice } }] }
        ]
      });
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

/**
 * Build order by clause for product sorting
 * @param {string} sortBy - Sort field
 * @param {string} sortOrder - Sort direction (asc/desc)
 * @returns {Array} Prisma orderBy array
 */
const buildOrderByClause = (sortBy, sortOrder) => {
  const order = sortOrder === 'desc' ? 'desc' : 'asc';
  
  switch (sortBy) {
    case 'price':
      return [{ salePrice: order }];
    
    case 'name':
      return [{ name: order }];
    
    case 'featured':
      return [
        { isFeatured: 'desc' },
        { name: 'asc' }
      ];
    
    case 'newest':
      return [{ createdAt: 'desc' }];
    
    case 'oldest':
      return [{ createdAt: 'asc' }];
    
    case 'popularity':
      // You can implement popularity based on order count or views
      return [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ];
    
    default:
      // Default sorting: featured first, then by name
      return [
        { isFeatured: 'desc' },
        { name: 'asc' }
      ];
  }
};

module.exports = {
  buildOrderByClause
};

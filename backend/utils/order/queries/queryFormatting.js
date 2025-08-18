/**
 * Build order by clause for sorting
 * @param {Object} sorting - Sort parameters
 * @returns {Object} Prisma orderBy clause
 */
const buildOrderByClause = (sorting) => {
  const { sortBy, sortOrder } = sorting;
  
  const orderBy = {};
  orderBy[sortBy] = sortOrder;
  
  return orderBy;
};

/**
 * Build order include clause for related data
 * @param {Boolean} includeItems - Whether to include order items
 * @param {Boolean} includeUser - Whether to include user data
 * @returns {Object} Prisma include clause
 */
const buildOrderIncludeClause = (includeItems = true, includeUser = false) => {
  const include = {};

  if (includeItems) {
    include.items = {
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            thumbnail: true,
            unit: true
          }
        }
      }
    };
  }

  if (includeUser) {
    include.user = {
      select: {
        id: true,
        name: true,
        email: true
      }
    };
  }

  return include;
};

/**
 * Calculate pagination metadata for orders
 * @param {Number} totalOrders - Total order count
 * @param {Object} pagination - Pagination parameters
 * @returns {Object} Pagination metadata
 */
const calculateOrderPaginationMetadata = (totalOrders, pagination) => {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(totalOrders / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    currentPage: page,
    totalPages: totalPages,
    totalOrders: totalOrders,
    ordersPerPage: limit,
    hasNextPage: hasNextPage,
    hasPrevPage: hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

module.exports = {
  buildOrderByClause,
  buildOrderIncludeClause,
  calculateOrderPaginationMetadata
};

/*
=== ORDER QUERY FORMATTING MODULE ===

This module handles query formatting and metadata calculation.

FUNCTIONALITY:
- Constructs Prisma orderBy clauses for sorting
- Builds include clauses for related data
- Calculates pagination metadata for responses

USAGE:
```javascript
const { buildOrderByClause, buildOrderIncludeClause, calculateOrderPaginationMetadata } = require('./queryFormatting');

// Build sorting clause
const orderBy = buildOrderByClause(sorting);

// Build include clause
const include = buildOrderIncludeClause(true, false);

// Calculate pagination metadata
const pagination = calculateOrderPaginationMetadata(totalCount, paginationParams);
```

FEATURES:
- Flexible sorting by any order field
- Configurable data inclusion (items, user data)
- Complete pagination metadata with navigation info
*/

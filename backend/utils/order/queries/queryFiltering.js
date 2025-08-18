/**
 * Build where clause for order filtering
 * @param {Object} params - Parsed query parameters
 * @returns {Object} Prisma where clause
 */
const buildOrderWhereClause = (params) => {
  const { userId, filters } = params;
  const { status, startDate, endDate } = filters;

  const whereClause = {
    userId: userId
  };

  // Add status filter
  if (status) {
    whereClause.status = status;
  }

  // Add date range filter
  if (startDate || endDate) {
    whereClause.createdAt = {};
    
    if (startDate) {
      whereClause.createdAt.gte = new Date(startDate);
    }
    
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.createdAt.lte = endOfDay;
    }
  }

  return whereClause;
};

/**
 * Build admin order where clause (for admin queries)
 * @param {Object} filters - Filter parameters
 * @returns {Object} Prisma where clause
 */
const buildAdminOrderWhereClause = (filters) => {
  const { status, startDate, endDate, userId } = filters;

  const whereClause = {};

  // Add user filter (admin can filter by specific user)
  if (userId) {
    whereClause.userId = parseInt(userId);
  }

  // Add status filter
  if (status) {
    whereClause.status = status;
  }

  // Add date range filter
  if (startDate || endDate) {
    whereClause.createdAt = {};
    
    if (startDate) {
      whereClause.createdAt.gte = new Date(startDate);
    }
    
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.createdAt.lte = endOfDay;
    }
  }

  return whereClause;
};

module.exports = {
  buildOrderWhereClause,
  buildAdminOrderWhereClause
};

/*
=== ORDER QUERY FILTERING MODULE ===

This module constructs Prisma where clauses for order filtering.

FUNCTIONALITY:
- User-specific order filtering (includes user ID constraint)
- Admin order filtering (can filter across all users)
- Status-based filtering
- Date range filtering with proper time handling

USAGE:
```javascript
const { buildOrderWhereClause, buildAdminOrderWhereClause } = require('./queryFiltering');

// For user orders
const userWhereClause = buildOrderWhereClause(parsedParams);

// For admin queries
const adminWhereClause = buildAdminOrderWhereClause(filters);
```

FILTER TYPES:
- User ID: Restricts to specific user's orders
- Status: Filters by order status
- Date Range: Filters by creation date with proper time boundaries
*/

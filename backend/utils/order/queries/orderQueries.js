// Re-export all order query functions from focused modules
const { parseOrderQueryParams } = require('./queryParsing');
const { buildOrderWhereClause, buildAdminOrderWhereClause } = require('./queryFiltering');
const { buildOrderByClause, buildOrderIncludeClause, calculateOrderPaginationMetadata } = require('./queryFormatting');

module.exports = {
  parseOrderQueryParams,
  buildOrderWhereClause,
  buildOrderByClause,
  buildOrderIncludeClause,
  calculateOrderPaginationMetadata,
  buildAdminOrderWhereClause
};

/*
=== ORDER QUERIES MODULE ===

This module provides a unified interface for all order query construction functions.

AVAILABLE FUNCTIONS:
- parseOrderQueryParams: Parse and structure query parameters
- buildOrderWhereClause: Build user-specific filtering conditions
- buildAdminOrderWhereClause: Build admin filtering conditions
- buildOrderByClause: Build sorting conditions
- buildOrderIncludeClause: Build data inclusion conditions
- calculateOrderPaginationMetadata: Calculate pagination metadata

USAGE:
```javascript
const orderQueries = require('./orderQueries');

// Parse query parameters
const params = orderQueries.parseOrderQueryParams(req.query, userId);

// Build query components
const whereClause = orderQueries.buildOrderWhereClause(params);
const orderBy = orderQueries.buildOrderByClause(params.sorting);
const include = orderQueries.buildOrderIncludeClause(true, false);

// Calculate pagination
const pagination = orderQueries.calculateOrderPaginationMetadata(totalCount, params.pagination);
```

MODULAR DESIGN:
- queryParsing.js: Parameter parsing and validation
- queryFiltering.js: Where clause construction
- queryFormatting.js: Sorting, inclusion, and pagination
*/
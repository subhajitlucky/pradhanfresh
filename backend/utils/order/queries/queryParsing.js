/**
 * Parse order query parameters
 * @param {Object} query - Request query parameters
 * @param {Number} userId - User ID for filtering
 * @returns {Object} Parsed parameters
 */
const parseOrderQueryParams = (query, userId) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    startDate,
    endDate
  } = query;

  return {
    userId,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit)
    },
    filters: {
      status,
      startDate,
      endDate
    },
    sorting: {
      sortBy,
      sortOrder
    }
  };
};

module.exports = {
  parseOrderQueryParams
};

/*
=== ORDER QUERY PARSING MODULE ===

This module handles parsing and structuring of order query parameters.

FUNCTIONALITY:
- Parses pagination parameters (page, limit)
- Extracts filter parameters (status, date range)
- Handles sorting parameters (sortBy, sortOrder)
- Provides default values for missing parameters

USAGE:
```javascript
const { parseOrderQueryParams } = require('./queryParsing');
const params = parseOrderQueryParams(req.query, userId);
```

PARAMETERS HANDLED:
- page: Page number (default: 1)
- limit: Items per page (default: 10)
- status: Order status filter
- sortBy: Sort field (default: 'createdAt')
- sortOrder: Sort direction (default: 'desc')
- startDate: Filter start date
- endDate: Filter end date
*/

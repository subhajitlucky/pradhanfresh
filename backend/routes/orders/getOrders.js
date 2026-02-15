const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');
const { getOrderStatusInfo } = require('../../utils/orderUtils');
const { validatePaginationParams, validateSortParams } = require('../../utils/order/validation/orderValidation');
const { parseOrderQueryParams, buildOrderWhereClause, buildOrderByClause, buildOrderIncludeClause, calculateOrderPaginationMetadata } = require('../../utils/order/queries/orderQueries');

// GET /api/orders - Get user's orders with filtering and pagination
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // === PARSE QUERY PARAMETERS ===
    const params = parseOrderQueryParams(req.query, userId);

    // === VALIDATE PARAMETERS ===
    const paginationValidation = validatePaginationParams(params.pagination);
    if (!paginationValidation.valid) {
      return res.status(400).json(paginationValidation);
    }

    const sortValidation = validateSortParams(params.sorting);
    if (!sortValidation.valid) {
      return res.status(400).json(sortValidation);
    }

    // === BUILD QUERY COMPONENTS ===
    const whereClause = buildOrderWhereClause(params);
    const orderBy = buildOrderByClause(params.sorting);
    const include = buildOrderIncludeClause(true, false); // Include items but not user (user is making request)

    // === GET TOTAL COUNT ===
    const totalOrders = await prisma.order.count({
      where: whereClause
    });

    // === FETCH ORDERS ===
    const skip = (params.pagination.page - 1) * params.pagination.limit;
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: include,
      orderBy: orderBy,
      skip: skip,
      take: params.pagination.limit
    });

    // === ENHANCE ORDERS WITH STATUS INFO ===
    const enhancedOrders = orders.map(order => ({
      ...order,
      statusInfo: getOrderStatusInfo(order.status),
      deliveryAddress: JSON.parse(order.deliveryAddress || '{}')
    }));

    // === BUILD PAGINATION METADATA ===
    const paginationMetadata = calculateOrderPaginationMetadata(totalOrders, params.pagination);

    // === BUILD FILTER METADATA ===
    const filterMetadata = {
      appliedFilters: {
        status: params.filters.status || null,
        dateRange: (params.filters.startDate || params.filters.endDate) ? {
          startDate: params.filters.startDate,
          endDate: params.filters.endDate
        } : null,
        sortBy: params.sorting.sortBy,
        sortOrder: params.sorting.sortOrder
      },
      totalResults: totalOrders
    };

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: enhancedOrders,
      pagination: paginationMetadata,
      filters: filterMetadata
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;

/*
=== GET ORDERS ROUTE HANDLER ===

This route handler provides comprehensive order listing for users with filtering, sorting, and pagination capabilities.

ROUTE INFORMATION:
- Method: GET
- Path: /api/orders
- Authentication: Required
- Purpose: Retrieve user's orders with flexible filtering options

REQUEST FLOW:
1. **Parameter Parsing** - Extracts and parses query parameters
2. **Parameter Validation** - Validates pagination and sorting parameters
3. **Query Building** - Constructs database query components
4. **Count Query** - Gets total count for pagination metadata
5. **Data Query** - Fetches filtered and paginated orders
6. **Data Enhancement** - Adds status info and parses addresses
7. **Response** - Returns orders with comprehensive metadata

QUERY PARAMETERS:

**Pagination**:
- page: Page number (default: 1, min: 1)
- limit: Items per page (default: 10, min: 1, max: 50)

**Filtering**:
- status: Filter by order status (PENDING, CONFIRMED, PROCESSING, etc.)
- startDate: Orders created after this date (YYYY-MM-DD format)
- endDate: Orders created before this date (YYYY-MM-DD format)

**Sorting**:
- sortBy: Sort field (createdAt, updatedAt, totalAmount, status) - default: createdAt
- sortOrder: Sort order (asc, desc) - default: desc

EXAMPLE REQUESTS:
```
GET /api/orders?page=1&limit=10
GET /api/orders?status=PENDING&sortBy=createdAt&sortOrder=desc
GET /api/orders?startDate=2024-01-01&endDate=2024-01-31
GET /api/orders?status=DELIVERED&sortBy=totalAmount&sortOrder=desc
```

SUCCESS RESPONSE:
```javascript
{
  success: true,
  message: "Orders retrieved successfully",
  data: [
    {
      // Order object with items and product details
      statusInfo: {
        label: "Confirmed",
        description: "Order confirmed, preparing for shipment",
        color: "blue",
        canCancel: true
      },
      deliveryAddress: {
        // Parsed delivery address object
      }
    }
  ],
  pagination: {
    currentPage: 1,
    totalPages: 3,
    totalOrders: 25,
    ordersPerPage: 10,
    hasNextPage: true,
    hasPrevPage: false,
    nextPage: 2,
    prevPage: null
  },
  filters: {
    appliedFilters: {
      status: "PENDING",
      dateRange: { startDate: "2024-01-01", endDate: "2024-01-31" },
      sortBy: "createdAt",
      sortOrder: "desc"
    },
    totalResults: 25
  }
}
```

ERROR RESPONSES:
- 400: Invalid parameters (negative page, invalid sort field, etc.)
- 500: Server errors

DATA ENHANCEMENT:
- **Status Info**: Adds user-friendly status information
- **Address Parsing**: Converts JSON delivery address to object
- **Related Data**: Includes order items and product details
- **Metadata**: Comprehensive pagination and filter information

MODULAR DESIGN BENEFITS:
- **Query Builder**: Reusable query construction logic
- **Validation Modules**: Comprehensive parameter validation
- **Pagination**: Consistent pagination handling
- **Status Enhancement**: Rich status information for UI

PERFORMANCE FEATURES:
- Efficient pagination with skip/take
- Selective field querying for related data
- Optimized count queries with filters
- Indexed field assumptions for fast sorting

USER EXPERIENCE:
- Rich status information for order tracking
- Flexible filtering for order management
- Comprehensive pagination for large order lists
- Consistent response structure for frontend integration

SECURITY FEATURES:
- User-scoped queries (users can only see their own orders)
- Parameter validation prevents abuse
- No sensitive information exposed
- Pagination limits prevent excessive resource usage

EXTENSIBILITY:
- Easy to add new filter parameters
- Sorting can be extended to additional fields
- Status enhancement can include more details
- Compatible with order tracking and notification systems
*/
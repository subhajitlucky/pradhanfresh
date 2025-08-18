const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const { parseQueryParameters, validateQueryParameters, buildWhereClause, buildOrderByClause, buildPaginationMetadata, buildFilterMetadata } = require('../../utils/product/queryBuilder');

// GET /api/products - Get all products with pagination, search, and filtering
router.get('/', async (req, res) => {
  try {
    // === PARSE QUERY PARAMETERS ===
    const params = parseQueryParameters(req.query);
    
    // === VALIDATE PARAMETERS ===
    const validation = validateQueryParameters(params);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // === BUILD DATABASE QUERY COMPONENTS ===
    const whereClause = buildWhereClause(params.filters);
    const orderBy = buildOrderByClause(params.sorting.sortBy, params.sorting.sortOrder);

    // === GET TOTAL COUNT FOR PAGINATION ===
    const totalProducts = await prisma.product.count({
      where: whereClause
    });

    // === FETCH FILTERED AND PAGINATED PRODUCTS ===
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: orderBy,
      skip: params.pagination.skip,
      take: params.pagination.limit
    });

    // === BUILD RESPONSE METADATA ===
    const paginationMetadata = buildPaginationMetadata(totalProducts, params.pagination);
    const filterMetadata = buildFilterMetadata(params.filters, params.sorting, totalProducts);

    // === RETURN SUCCESS RESPONSE ===
    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      pagination: paginationMetadata,
      filters: filterMetadata
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;

/*
=== GET PRODUCTS ROUTE HANDLER ===

This route handler provides comprehensive product listing with advanced filtering, searching, sorting, and pagination capabilities.

ROUTE INFORMATION:
- Method: GET
- Path: /api/products
- Authentication: Not required (public endpoint)
- Purpose: Retrieve products with flexible filtering and pagination

REQUEST FLOW:
1. **Parameter Parsing** - Extracts and parses query parameters
2. **Parameter Validation** - Validates pagination and sorting parameters
3. **Query Building** - Constructs database query components
4. **Count Query** - Gets total count for pagination metadata
5. **Data Query** - Fetches filtered and paginated products
6. **Metadata Generation** - Builds pagination and filter metadata
7. **Response** - Returns products with comprehensive metadata

QUERY PARAMETERS:

**Pagination**:
- page: Page number (default: 1, min: 1)
- limit: Items per page (default: 6, min: 1, max: 50)

**Search**:
- search: Text search across name, description, and category name

**Filtering**:
- categories: Comma-separated category IDs (e.g., "1,2,3")
- minPrice: Minimum price filter
- maxPrice: Maximum price filter
- isOrganic: "true" or "false" for organic products
- isFeatured: "true" or "false" for featured products
- isAvailable: "true" or "false" for product availability (default: "true")

**Sorting**:
- sortBy: Sort field (createdAt, name, price) - default: createdAt
- sortOrder: Sort order (asc, desc) - default: desc

SEARCH FUNCTIONALITY:
Searches across multiple fields:
- Product name (case-insensitive)
- Product description (case-insensitive)
- Product short description (case-insensitive)
- Category name (case-insensitive)

EXAMPLE REQUESTS:
```
GET /api/products?page=1&limit=12
GET /api/products?search=apple&categories=1,2&sortBy=price&sortOrder=asc
GET /api/products?minPrice=50&maxPrice=200&isOrganic=true
GET /api/products?isFeatured=true&sortBy=name&sortOrder=asc
```

SUCCESS RESPONSE:
```javascript
{
  success: true,
  message: "Products retrieved successfully",
  data: [
    // Array of product objects with category and creator info
  ],
  pagination: {
    currentPage: 1,
    totalPages: 5,
    totalProducts: 25,
    productsPerPage: 6,
    hasNextPage: true,
    hasPrevPage: false,
    nextPage: 2,
    prevPage: null
  },
  filters: {
    totalResults: 25,
    appliedFilters: {
      search: "apple",
      categories: [1, 2],
      priceRange: { min: 50, max: 200 },
      isOrganic: true,
      isFeatured: null,
      sortBy: "price",
      sortOrder: "asc"
    }
  }
}
```

ERROR RESPONSES:
- 400: Invalid parameters (negative page, invalid sort field, etc.)
- 500: Server errors

MODULAR DESIGN BENEFITS:
- **Query Builder**: Reusable query construction logic
- **Parameter Parsing**: Standardized parameter handling
- **Validation**: Comprehensive parameter validation
- **Metadata Building**: Consistent response structure
- **Maintainability**: Clear separation of concerns

PERFORMANCE FEATURES:
- Efficient database queries with proper indexing assumptions
- Pagination prevents excessive data loading
- Count queries are optimized with filters
- Related data (category, creator) loaded in single query

FRONTEND INTEGRATION:
- Comprehensive pagination metadata for UI components
- Filter metadata shows applied filters for user feedback
- Consistent response structure for easy state management
- Support for all common e-commerce filtering patterns

SECURITY CONSIDERATIONS:
- Parameter validation prevents abuse
- Pagination limits prevent excessive resource usage
- No authentication required for public product browsing
- Safe parameter parsing prevents injection attacks

EXTENSIBILITY:
- Easy to add new filter parameters
- Sorting can be extended to additional fields
- Search can include additional product fields
- Compatible with caching and CDN strategies
*/
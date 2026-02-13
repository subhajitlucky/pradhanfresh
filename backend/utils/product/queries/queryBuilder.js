/**
 * Product Query Builder - Main module that combines all query building functions
 * This module orchestrates filtering, sorting, pagination, and field selection for product queries
 */

const { buildWhereClause } = require('./filters');
const { buildOrderByClause } = require('./sorting');
const { calculatePagination, buildPaginationMeta } = require('./pagination');
const { buildIncludeClause, buildSelectClause } = require('./includes');

/**
 * Parse query parameters from request
 * @param {Object} query - Raw query from req.query
 * @returns {Object} Parsed parameters
 */
const parseQueryParameters = (query) => {
  const {
    page = 1,
    limit = 6,
    search = '',
    categories = '',
    minPrice,
    maxPrice,
    isOrganic,
    isFeatured,
    isAvailable = 'true',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = query;

  // Parse categories from comma-separated string to array of numbers
  const categoryIds = categories
    ? categories.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    : [];

  return {
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit)
    },
    filters: {
      search: search.toString(),
      categoryIds,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      isOrganic: isOrganic !== undefined ? isOrganic === 'true' : undefined,
      isFeatured: isFeatured !== undefined ? isFeatured === 'true' : undefined,
      isAvailable: isAvailable === 'false' ? false : true
    },
    sorting: {
      sortBy: sortBy.toString(),
      sortOrder: sortOrder.toString()
    }
  };
};

/**
 * Validate parsed query parameters
 * @param {Object} params - Parsed parameters
 * @returns {Object} Validation result
 */
const validateQueryParameters = (params) => {
  const { page, limit } = params.pagination;
  
  if (isNaN(page) || page < 1) {
    return { valid: false, message: 'Page must be a positive integer' };
  }
  
  if (isNaN(limit) || limit < 1) {
    return { valid: false, message: 'Limit must be a positive integer' };
  }

  return { valid: true };
};

/**
 * Build pagination metadata for response
 * @param {number} totalProducts - Total number of products found
 * @param {Object} paginationParams - Pagination parameters (page, limit)
 * @returns {Object} Pagination metadata
 */
const buildPaginationMetadata = (totalProducts, paginationParams) => {
  const { page, limit } = paginationParams;
  const totalPages = Math.ceil(totalProducts / limit);
  
  return {
    currentPage: page,
    totalPages,
    totalProducts,
    productsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null
  };
};

/**
 * Build filter metadata for response
 * @param {Object} filters - Applied filters
 * @param {Object} sorting - Applied sorting
 * @param {number} totalResults - Total results found
 * @returns {Object} Filter metadata
 */
const buildFilterMetadata = (filters, sorting, totalResults) => {
  return {
    totalResults,
    appliedFilters: {
      search: filters.search || null,
      categories: filters.categoryIds.length > 0 ? filters.categoryIds : null,
      priceRange: {
        min: filters.minPrice !== undefined ? filters.minPrice : null,
        max: filters.maxPrice !== undefined ? filters.maxPrice : null
      },
      isOrganic: filters.isOrganic !== undefined ? filters.isOrganic : null,
      isFeatured: filters.isFeatured !== undefined ? filters.isFeatured : null,
      sortBy: sorting.sortBy,
      sortOrder: sorting.sortOrder
    }
  };
};

/**
 * Build complete product query with all options
 * @param {Object} queryParams - Query parameters from request
 * @param {Object} options - Additional query options
 * @returns {Object} Complete query configuration
 */
const buildProductQuery = (queryParams, options = {}) => {
  const params = parseQueryParameters(queryParams);
  const pagination = calculatePagination(params.pagination.page, params.pagination.limit);
  const whereClause = buildWhereClause(params.filters);
  const orderBy = buildOrderByClause(params.sorting.sortBy, params.sorting.sortOrder);
  const includeClause = buildIncludeClause(options);
  const selectClause = buildSelectClause(options);

  return {
    where: whereClause,
    orderBy,
    skip: pagination.skip,
    take: pagination.limit,
    include: selectClause ? undefined : includeClause,
    select: selectClause ? { ...selectClause, ...includeClause } : undefined,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      skip: pagination.skip
    }
  };
};

module.exports = {
  parseQueryParameters,
  validateQueryParameters,
  buildWhereClause,
  buildOrderByClause,
  buildPaginationMetadata,
  buildFilterMetadata,
  buildProductQuery,
  buildPaginationMeta
};
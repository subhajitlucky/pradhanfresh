/**
 * Product Query Builder - Main module that combines all query building functions
 * This module orchestrates filtering, sorting, pagination, and field selection for product queries
 */

const { buildWhereClause } = require('./filters');
const { buildOrderByClause } = require('./sorting');
const { calculatePagination, buildPaginationMeta } = require('./pagination');
const { buildIncludeClause, buildSelectClause } = require('./includes');

/**
 * Build complete product query with all options
 * @param {Object} queryParams - Query parameters from request
 * @param {Object} options - Additional query options
 * @returns {Object} Complete query configuration
 * 
 * Usage Examples:
 * 
 * // Basic product listing
 * const query = buildProductQuery({
 *   page: 1,
 *   limit: 12,
 *   search: 'organic',
 *   sortBy: 'price',
 *   sortOrder: 'asc'
 * });
 * 
 * // Admin product listing
 * const adminQuery = buildProductQuery({
 *   page: 1,
 *   limit: 20
 * }, {
 *   forAdmin: true,
 *   includeOrderItems: true
 * });
 * 
 * // Minimal product data for dropdowns
 * const minimalQuery = buildProductQuery({}, {
 *   minimal: true,
 *   includeCategory: false
 * });
 */
const buildProductQuery = (queryParams, options = {}) => {
  const {
    page,
    limit,
    search,
    category,
    categories,
    minPrice,
    maxPrice,
    isOrganic,
    isFeatured,
    isAvailable,
    sortBy,
    sortOrder
  } = queryParams;

  // Parse category filters
  let categoryIds = [];
  if (category) {
    categoryIds = Array.isArray(category) ? category : [category];
  }
  if (categories) {
    const additionalCategories = Array.isArray(categories) ? categories : [categories];
    categoryIds = [...categoryIds, ...additionalCategories];
  }
  
  // Remove duplicates and convert to integers
  categoryIds = [...new Set(categoryIds)].map(id => parseInt(id)).filter(id => !isNaN(id));

  // Build pagination
  const pagination = calculatePagination(page, limit);

  // Build filters
  const whereClause = buildWhereClause({
    search,
    categoryIds,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    isOrganic: isOrganic !== undefined ? isOrganic === 'true' : undefined,
    isFeatured: isFeatured !== undefined ? isFeatured === 'true' : undefined,
    isAvailable: isAvailable !== undefined ? isAvailable === 'true' : true
  });

  // Build sorting
  const orderBy = buildOrderByClause(sortBy, sortOrder);

  // Build field selection and includes
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

/**
 * Build query for getting total count (used for pagination)
 * @param {Object} queryParams - Same query parameters as buildProductQuery
 * @returns {Object} Count query configuration
 */
const buildProductCountQuery = (queryParams) => {
  const {
    search,
    category,
    categories,
    minPrice,
    maxPrice,
    isOrganic,
    isFeatured,
    isAvailable
  } = queryParams;

  // Parse category filters (same logic as main query)
  let categoryIds = [];
  if (category) {
    categoryIds = Array.isArray(category) ? category : [category];
  }
  if (categories) {
    const additionalCategories = Array.isArray(categories) ? categories : [categories];
    categoryIds = [...categoryIds, ...additionalCategories];
  }
  categoryIds = [...new Set(categoryIds)].map(id => parseInt(id)).filter(id => !isNaN(id));

  // Build filters (same logic as main query)
  const whereClause = buildWhereClause({
    search,
    categoryIds,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    isOrganic: isOrganic !== undefined ? isOrganic === 'true' : undefined,
    isFeatured: isFeatured !== undefined ? isFeatured === 'true' : undefined,
    isAvailable: isAvailable !== undefined ? isAvailable === 'true' : true
  });

  return { where: whereClause };
};

module.exports = {
  buildProductQuery,
  buildProductCountQuery,
  buildPaginationMeta
};
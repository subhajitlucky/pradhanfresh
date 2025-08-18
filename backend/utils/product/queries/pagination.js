/**
 * Calculate pagination parameters
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {Object} Pagination parameters
 */
const calculatePagination = (page, limit) => {
  const parsedPage = Math.max(1, parseInt(page) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit) || 12));
  const skip = (parsedPage - 1) * parsedLimit;

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip
  };
};

/**
 * Build pagination metadata
 * @param {number} totalCount - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const buildPaginationMeta = (totalCount, page, limit) => {
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    total: totalCount,
    page: page,
    pages: totalPages,
    limit: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null
  };
};

module.exports = {
  calculatePagination,
  buildPaginationMeta
};

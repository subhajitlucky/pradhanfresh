/**
 * Build include clause for product queries
 * @param {Object} options - Include options
 * @returns {Object} Prisma include clause
 */
const buildIncludeClause = (options = {}) => {
  const {
    includeCategory = true,
    includeCreatedBy = true,
    includeOrderItems = false,
    includeCartItems = false
  } = options;

  const includeClause = {};

  // Include category information
  if (includeCategory) {
    includeClause.category = {
      select: {
        id: true,
        name: true,
        slug: true,
        image: true
      }
    };
  }

  // Include creator information (for admin views)
  if (includeCreatedBy) {
    includeClause.createdBy = {
      select: {
        id: true,
        name: true,
        email: true
      }
    };
  }

  // Include order items count (for analytics)
  if (includeOrderItems) {
    includeClause._count = {
      select: {
        orderItems: true
      }
    };
  }

  // Include cart items count (for popularity metrics)
  if (includeCartItems) {
    if (includeClause._count) {
      includeClause._count.select.cartItems = true;
    } else {
      includeClause._count = {
        select: {
          cartItems: true
        }
      };
    }
  }

  return includeClause;
};

/**
 * Build select clause for product queries
 * @param {Object} options - Select options
 * @returns {Object} Prisma select clause
 */
const buildSelectClause = (options = {}) => {
  const { minimal = false, forList = false, forAdmin = false } = options;

  if (minimal) {
    return {
      id: true,
      name: true,
      slug: true,
      salePrice: true,
      thumbnail: true,
      unit: true,
      isAvailable: true
    };
  }

  if (forList) {
    return {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      price: true,
      salePrice: true,
      thumbnail: true,
      unit: true,
      stock: true,
      isFeatured: true,
      isOrganic: true,
      isAvailable: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    };
  }

  if (forAdmin) {
    return undefined; // Return all fields for admin
  }

  // Default selection for regular product views
  return {
    id: true,
    name: true,
    slug: true,
    description: true,
    shortDescription: true,
    price: true,
    salePrice: true,
    images: true,
    thumbnail: true,
    stock: true,
    unit: true,
    weight: true,
    sku: true,
    isFeatured: true,
    isOrganic: true,
    isAvailable: true,
    createdAt: true,
    updatedAt: true
  };
};

module.exports = {
  buildIncludeClause,
  buildSelectClause
};

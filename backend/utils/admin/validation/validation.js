/**
 * Validate pagination parameters
 */
const validatePaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;

  if (page < 1) {
    return {
      valid: false,
      message: 'Page must be greater than 0',
      error: 'Validation Error'
    };
  }

  if (limit < 1 || limit > 100) {
    return {
      valid: false,
      message: 'Limit must be between 1 and 100',
      error: 'Validation Error'
    };
  }

  return {
    valid: true,
    data: {
      page,
      limit,
      skip: (page - 1) * limit
    }
  };
};

/**
 * Validate user ID parameter
 */
const validateUserId = (id) => {
  const userId = parseInt(id);
  
  if (isNaN(userId) || userId <= 0) {
    return {
      valid: false,
      message: 'Invalid user ID',
      error: 'Validation Error'
    };
  }

  return { valid: true, data: { userId } };
};

/**
 * Validate user role update
 */
const validateUserRole = (data) => {
  const { role } = data;

  if (!role) {
    return {
      valid: false,
      message: 'Role is required',
      error: 'Validation Error'
    };
  }

  const validRoles = ['USER', 'ADMIN'];
  if (!validRoles.includes(role)) {
    return {
      valid: false,
      message: 'Invalid role. Must be USER or ADMIN',
      error: 'Validation Error'
    };
  }

  return { valid: true, data: { role } };
};

/**
 * Validate category data
 */
const validateCategory = (data) => {
  const { name, description, image, isActive } = data;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return {
      valid: false,
      message: 'Category name is required and must be a non-empty string',
      error: 'Validation Error'
    };
  }

  if (name.trim().length < 2) {
    return {
      valid: false,
      message: 'Category name must be at least 2 characters long',
      error: 'Validation Error'
    };
  }

  if (name.trim().length > 50) {
    return {
      valid: false,
      message: 'Category name must not exceed 50 characters',
      error: 'Validation Error'
    };
  }

  if (description && typeof description !== 'string') {
    return {
      valid: false,
      message: 'Description must be a string',
      error: 'Validation Error'
    };
  }

  if (description && description.length > 500) {
    return {
      valid: false,
      message: 'Description must not exceed 500 characters',
      error: 'Validation Error'
    };
  }

  if (image && typeof image !== 'string') {
    return {
      valid: false,
      message: 'Image must be a string URL',
      error: 'Validation Error'
    };
  }

  return {
    valid: true,
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      image: image?.trim() || null,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    }
  };
};

/**
 * Validate category ID parameter
 */
const validateCategoryId = (id) => {
  const categoryId = parseInt(id);
  
  if (isNaN(categoryId) || categoryId <= 0) {
    return {
      valid: false,
      message: 'Invalid category ID',
      error: 'Validation Error'
    };
  }

  return { valid: true, data: { categoryId } };
};

/**
 * Validate category update data
 */
const validateCategoryUpdate = (data) => {
  const { name, description, image, isActive } = data;
  const updateData = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      return {
        valid: false,
        message: 'Category name must be a non-empty string',
        error: 'Validation Error'
      };
    }

    if (name.trim().length < 2 || name.trim().length > 50) {
      return {
        valid: false,
        message: 'Category name must be between 2 and 50 characters',
        error: 'Validation Error'
      };
    }

    updateData.name = name.trim();
  }

  if (description !== undefined) {
    if (description && typeof description !== 'string') {
      return {
        valid: false,
        message: 'Description must be a string',
        error: 'Validation Error'
      };
    }

    if (description && description.length > 500) {
      return {
        valid: false,
        message: 'Description must not exceed 500 characters',
        error: 'Validation Error'
      };
    }

    updateData.description = description?.trim() || null;
  }

  if (image !== undefined) {
    if (image && typeof image !== 'string') {
      return {
        valid: false,
        message: 'Image must be a string URL',
        error: 'Validation Error'
      };
    }

    updateData.image = image?.trim() || null;
  }

  if (isActive !== undefined) {
    updateData.isActive = Boolean(isActive);
  }

  return { valid: true, data: updateData };
};

module.exports = {
  validatePaginationParams,
  validateUserId,
  validateUserRole,
  validateCategory,
  validateCategoryId,
  validateCategoryUpdate
};
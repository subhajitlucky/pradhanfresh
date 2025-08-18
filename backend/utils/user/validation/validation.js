/**
 * Validate user profile update data
 */
const validateProfileUpdate = (data) => {
  const { name } = data;

  if (!name) {
    return {
      valid: false,
      message: 'Name is required',
      error: 'Validation Error'
    };
  }

  if (typeof name !== 'string' || name.trim().length === 0) {
    return {
      valid: false,
      message: 'Name must be a non-empty string',
      error: 'Validation Error'
    };
  }

  if (name.trim().length < 2) {
    return {
      valid: false,
      message: 'Name must be at least 2 characters long',
      error: 'Validation Error'
    };
  }

  if (name.trim().length > 50) {
    return {
      valid: false,
      message: 'Name must not exceed 50 characters',
      error: 'Validation Error'
    };
  }

  return { valid: true, data: { name: name.trim() } };
};

/**
 * Validate password change data
 */
const validatePasswordChange = (data) => {
  const { currentPassword, newPassword } = data;

  if (!currentPassword || !newPassword) {
    return {
      valid: false,
      message: 'Current password and new password are required',
      error: 'Validation Error'
    };
  }

  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return {
      valid: false,
      message: 'Passwords must be strings',
      error: 'Validation Error'
    };
  }

  if (newPassword.length < 6) {
    return {
      valid: false,
      message: 'New password must be at least 6 characters long',
      error: 'Validation Error'
    };
  }

  if (newPassword.length > 100) {
    return {
      valid: false,
      message: 'New password must not exceed 100 characters',
      error: 'Validation Error'
    };
  }

  if (currentPassword === newPassword) {
    return {
      valid: false,
      message: 'New password must be different from current password',
      error: 'Validation Error'
    };
  }

  return { valid: true };
};

/**
 * Validate address data
 */
const validateAddress = (data) => {
  const requiredFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
  const missingFields = [];

  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    return {
      valid: false,
      message: `Missing required fields: ${missingFields.join(', ')}`,
      error: 'Validation Error'
    };
  }

  // Validate specific field formats
  const { fullName, phone, pincode } = data;

  // Validate full name
  if (fullName.trim().length < 2) {
    return {
      valid: false,
      message: 'Full name must be at least 2 characters long',
      error: 'Validation Error'
    };
  }

  // Validate phone number (Indian format)
  const phoneRegex = /^[6-9]\d{9}$/;
  const cleanPhone = phone.toString().replace(/\D/g, '');
  if (!phoneRegex.test(cleanPhone)) {
    return {
      valid: false,
      message: 'Phone number must be a valid 10-digit Indian mobile number',
      error: 'Validation Error'
    };
  }

  // Validate pincode (Indian format)
  const pincodeRegex = /^\d{6}$/;
  if (!pincodeRegex.test(pincode.toString())) {
    return {
      valid: false,
      message: 'Pincode must be a valid 6-digit Indian postal code',
      error: 'Validation Error'
    };
  }

  return { valid: true };
};

/**
 * Validate address ID parameter
 */
const validateAddressId = (id) => {
  const addressId = parseInt(id);
  
  if (isNaN(addressId) || addressId <= 0) {
    return {
      valid: false,
      message: 'Invalid address ID',
      error: 'Validation Error'
    };
  }

  return { valid: true, data: { addressId } };
};

module.exports = {
  validateProfileUpdate,
  validatePasswordChange,
  validateAddress,
  validateAddressId
};
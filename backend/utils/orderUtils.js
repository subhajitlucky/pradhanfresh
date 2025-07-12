const prisma = require('../prisma/client');

/**
 * Generate unique order number
 * Format: PF-YYYY-XXXXXX (e.g., PF-2024-000001)
 * @returns {Promise<string>} Generated order number
 */
const generateOrderNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `PF-${currentYear}-`;
  
  // Get the latest order number for current year
  const latestOrder = await prisma.order.findFirst({
    where: {
      orderNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      orderNumber: 'desc'
    }
  });

  let nextNumber = 1;
  if (latestOrder) {
    // Extract number from order number (e.g., "PF-2024-000123" -> 123)
    const lastNumber = parseInt(latestOrder.orderNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  // Format with leading zeros (6 digits)
  const formattedNumber = nextNumber.toString().padStart(6, '0');
  return `${prefix}${formattedNumber}`;
};

/**
 * Calculate order totals
 * @param {Array} orderItems - Array of order items
 * @param {Object} options - Additional options (deliveryFee, tax, discount)
 * @returns {Object} Calculated totals
 */
const calculateOrderTotals = (orderItems, options = {}) => {
  const { deliveryFee = 0, tax = 0, discount = 0 } = options;
  
  // Calculate subtotal from items
  const subtotal = orderItems.reduce((total, item) => total + item.subtotal, 0);
  
  // Calculate tax (percentage)
  const taxAmount = subtotal * (tax / 100);
  
  // Calculate total amount
  const totalAmount = subtotal + deliveryFee + taxAmount - discount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100, // Round to 2 decimal places
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    tax: Math.round(taxAmount * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100
  };
};

/**
 * Calculate item subtotal
 * @param {Number} quantity - Quantity of the item
 * @param {Number} price - Price per unit
 * @returns {Number} Subtotal
 */
const calculateItemSubtotal = (quantity, price) => {
  return Math.round(quantity * price * 100) / 100;
};

/**
 * Validate order status transition
 * @param {String} currentStatus - Current order status
 * @param {String} newStatus - New status to transition to
 * @returns {Object} Validation result
 */
const validateStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED', 'RETURNED'],
    DELIVERED: ['RETURNED'],
    CANCELLED: [], // Terminal state
    RETURNED: []   // Terminal state
  };

  const allowedTransitions = validTransitions[currentStatus] || [];
  
  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      message: `Cannot transition from ${currentStatus} to ${newStatus}`
    };
  }

  return {
    valid: true,
    message: `Status transition from ${currentStatus} to ${newStatus} is valid`
  };
};

/**
 * Validate cart before order creation
 * @param {Object} cart - Cart object with items
 * @returns {Promise<Object>} Validation result
 */
const validateCartForOrder = async (cart) => {
  if (!cart || !cart.items || cart.items.length === 0) {
    return {
      valid: false,
      message: 'Cart is empty'
    };
  }

  const validationErrors = [];
  
  for (const item of cart.items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { stock: true, isAvailable: true, name: true }
    });

    if (!product) {
      validationErrors.push(`Product ${item.product?.name || item.productId} not found`);
      continue;
    }

    if (!product.isAvailable) {
      validationErrors.push(`${product.name} is no longer available`);
      continue;
    }

    if (product.stock < item.quantity) {
      validationErrors.push(`Only ${product.stock} units of ${product.name} available (requested: ${item.quantity})`);
    }
  }

  if (validationErrors.length > 0) {
    return {
      valid: false,
      message: 'Cart validation failed',
      errors: validationErrors
    };
  }

  return {
    valid: true,
    message: 'Cart is valid for order creation'
  };
};

/**
 * Update product stock after order
 * @param {Array} orderItems - Array of order items
 * @param {String} operation - 'REDUCE' or 'RESTORE'
 * @returns {Promise<void>}
 */
const updateProductStock = async (orderItems, operation = 'REDUCE') => {
  const stockUpdates = [];
  
  for (const item of orderItems) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { stock: true }
    });

    if (!product) continue;

    let newStock;
    if (operation === 'REDUCE') {
      newStock = Math.max(0, product.stock - item.quantity);
    } else if (operation === 'RESTORE') {
      newStock = product.stock + item.quantity;
    } else {
      continue;
    }

    stockUpdates.push(
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: newStock }
      })
    );
  }

  // Execute all stock updates in parallel
  await Promise.all(stockUpdates);
};

/**
 * Get order status display information
 * @param {String} status - Order status
 * @returns {Object} Status display info
 */
const getOrderStatusInfo = (status) => {
  const statusInfo = {
    PENDING: {
      label: 'Pending',
      description: 'Order received, awaiting confirmation',
      color: 'orange',
      canCancel: true
    },
    CONFIRMED: {
      label: 'Confirmed',
      description: 'Order confirmed, preparing for shipment',
      color: 'blue',
      canCancel: true
    },
    PROCESSING: {
      label: 'Processing',
      description: 'Order is being prepared and packed',
      color: 'purple',
      canCancel: true
    },
    SHIPPED: {
      label: 'Shipped',
      description: 'Order is on the way to you',
      color: 'indigo',
      canCancel: false
    },
    DELIVERED: {
      label: 'Delivered',
      description: 'Order has been delivered successfully',
      color: 'green',
      canCancel: false
    },
    CANCELLED: {
      label: 'Cancelled',
      description: 'Order has been cancelled',
      color: 'red',
      canCancel: false
    },
    RETURNED: {
      label: 'Returned',
      description: 'Order has been returned',
      color: 'gray',
      canCancel: false
    }
  };

  return statusInfo[status] || {
    label: status,
    description: 'Unknown status',
    color: 'gray',
    canCancel: false
  };
};

/**
 * Validate delivery address
 * @param {Object} address - Delivery address object
 * @returns {Object} Validation result
 */
const validateDeliveryAddress = (address) => {
  const requiredFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
  const missingFields = [];

  for (const field of requiredFields) {
    if (!address[field] || address[field].toString().trim() === '') {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    return {
      valid: false,
      message: `Missing required fields: ${missingFields.join(', ')}`
    };
  }

  // Validate pincode (6 digits)
  const pincodeRegex = /^\d{6}$/;
  if (!pincodeRegex.test(address.pincode)) {
    return {
      valid: false,
      message: 'Pincode must be 6 digits'
    };
  }

  // Validate phone (10 digits)
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(address.phone.toString().replace(/\D/g, ''))) {
    return {
      valid: false,
      message: 'Phone number must be 10 digits'
    };
  }

  return {
    valid: true,
    message: 'Delivery address is valid'
  };
};

/**
 * Calculate delivery fee based on location and order value
 * @param {String} pincode - Delivery pincode
 * @param {Number} orderValue - Order subtotal
 * @returns {Number} Delivery fee
 */
const calculateDeliveryFee = (pincode, orderValue) => {
  // Free delivery for orders above ₹500
  if (orderValue >= 500) {
    return 0;
  }

  // Basic delivery fee logic (can be enhanced with location-based pricing)
  const baseDeliveryFee = 40;
  
  // You can add location-based logic here
  // For example, different fees for different cities/regions
  
  return baseDeliveryFee;
};

module.exports = {
  generateOrderNumber,
  calculateOrderTotals,
  calculateItemSubtotal,
  validateStatusTransition,
  validateCartForOrder,
  updateProductStock,
  getOrderStatusInfo,
  validateDeliveryAddress,
  calculateDeliveryFee
}; 
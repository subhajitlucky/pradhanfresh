const axios = require('axios');

/**
 * Create axios instance with base configuration
 * @param {String} baseURL - Base API URL
 * @returns {Object} Configured axios instance
 */
const createApiClient = (baseURL = 'http://localhost:5000/api') => {
  return axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Login user and get authentication token
 * @param {Object} apiClient - Axios instance
 * @param {Object} credentials - User credentials
 * @returns {Promise<String>} Authentication token
 */
const loginUser = async (apiClient, credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data.success && response.data.token) {
      return response.data.token;
    }
    throw new Error('Login failed: Invalid response format');
  } catch (error) {
    throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Make authenticated API request
 * @param {Object} apiClient - Axios instance
 * @param {String} token - Authentication token
 * @param {String} method - HTTP method
 * @param {String} endpoint - API endpoint
 * @param {Object} data - Request data
 * @returns {Promise<Object>} API response
 */
const makeAuthenticatedRequest = async (apiClient, token, method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: endpoint,
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
      config.data = data;
    } else if (data && method.toLowerCase() === 'get') {
      config.params = data;
    }
    
    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    throw new Error(`API request failed: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Add items to cart
 * @param {Object} apiClient - Axios instance
 * @param {String} token - Authentication token
 * @param {Array} items - Array of items to add
 * @returns {Promise<Object>} Cart data
 */
const addItemsToCart = async (apiClient, token, items) => {
  console.log('Adding items to cart...');
  
  for (const item of items) {
    await makeAuthenticatedRequest(apiClient, token, 'post', '/cart/add', item);
  }
  
  const cartResponse = await makeAuthenticatedRequest(apiClient, token, 'get', '/cart');
  console.log(`✅ Added ${items.length} items to cart`);
  return cartResponse.data;
};

/**
 * Create order from cart
 * @param {Object} apiClient - Axios instance
 * @param {String} token - Authentication token
 * @param {Object} orderData - Order creation data
 * @returns {Promise<Object>} Created order
 */
const createOrder = async (apiClient, token, orderData) => {
  console.log('Creating order...');
  
  const response = await makeAuthenticatedRequest(apiClient, token, 'post', '/orders', orderData);
  console.log(`✅ Order created: ${response.data.orderNumber}`);
  return response.data;
};

/**
 * Get user orders
 * @param {Object} apiClient - Axios instance
 * @param {String} token - Authentication token
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} User orders
 */
const getUserOrders = async (apiClient, token, params = {}) => {
  const response = await makeAuthenticatedRequest(apiClient, token, 'get', '/orders', params);
  return response.data;
};

/**
 * Update order status (admin only)
 * @param {Object} apiClient - Axios instance
 * @param {String} adminToken - Admin authentication token
 * @param {String} orderNumber - Order number
 * @param {String} status - New status
 * @param {String} notes - Admin notes
 * @returns {Promise<Object>} Updated order
 */
const updateOrderStatus = async (apiClient, adminToken, orderNumber, status, notes = '') => {
  console.log(`Updating order ${orderNumber} status to ${status}...`);
  
  const response = await makeAuthenticatedRequest(
    apiClient, 
    adminToken, 
    'put', 
    `/orders/${orderNumber}/status`,
    { status, adminNotes: notes }
  );
  
  console.log(`✅ Order status updated to ${status}`);
  return response.data;
};

/**
 * Cancel order
 * @param {Object} apiClient - Axios instance
 * @param {String} token - Authentication token
 * @param {String} orderNumber - Order number
 * @param {String} reason - Cancellation reason
 * @returns {Promise<Object>} Cancelled order
 */
const cancelOrder = async (apiClient, token, orderNumber, reason = 'Test cancellation') => {
  console.log(`Cancelling order ${orderNumber}...`);
  
  const response = await makeAuthenticatedRequest(
    apiClient, 
    token, 
    'put', 
    `/orders/${orderNumber}/cancel`,
    { reason }
  );
  
  console.log(`✅ Order cancelled: ${orderNumber}`);
  return response.data;
};

/**
 * Get products with filters
 * @param {Object} apiClient - Axios instance
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Array>} Products
 */
const getProducts = async (apiClient, filters = {}) => {
  const response = await apiClient.get('/products', { params: filters });
  return response.data;
};

/**
 * Wait for specified duration
 * @param {Number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry operation with exponential backoff
 * @param {Function} operation - Operation to retry
 * @param {Number} maxRetries - Maximum retry attempts
 * @param {Number} baseDelay - Base delay in milliseconds
 * @returns {Promise<any>} Operation result
 */
const retryOperation = async (operation, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await wait(delay);
    }
  }
  
  throw lastError;
};

module.exports = {
  createApiClient,
  loginUser,
  makeAuthenticatedRequest,
  addItemsToCart,
  createOrder,
  getUserOrders,
  updateOrderStatus,
  cancelOrder,
  getProducts,
  wait,
  retryOperation
};

/*
=== API HELPERS MODULE ===

This module provides reusable helper functions for API testing operations.

KEY HELPER FUNCTIONS:

1. **API Client Management**:
   - Configured axios instance creation
   - Centralized timeout and header settings
   - Base URL configuration

2. **Authentication Helpers**:
   - User login with token extraction
   - Authenticated request wrapper
   - Token management for test sessions

3. **Cart Operations**:
   - Bulk item addition to cart
   - Cart state management
   - Cart-to-order conversion

4. **Order Management**:
   - Order creation from cart
   - Order status updates (admin)
   - Order cancellation
   - Order retrieval and filtering

5. **Product Operations**:
   - Product listing with filters
   - Product search functionality
   - Category-based filtering

6. **Utility Functions**:
   - Wait/delay operations
   - Retry logic with exponential backoff
   - Error handling and logging

TESTING PATTERNS:
- Consistent API response handling
- Proper error propagation
- Clear progress logging
- Reusable operation patterns

USAGE EXAMPLES:
```javascript
const { createApiClient, loginUser, addItemsToCart, createOrder } = require('./apiHelpers');

// Create API client
const apiClient = createApiClient('http://localhost:5000/api');

// Login and get token
const token = await loginUser(apiClient, credentials);

// Add items to cart
const cart = await addItemsToCart(apiClient, token, [
  { productId: 1, quantity: 2 },
  { productId: 2, quantity: 1 }
]);

// Create order
const order = await createOrder(apiClient, token, orderData);
```

ERROR HANDLING:
- Comprehensive error catching and propagation
- Clear error messages for debugging
- HTTP status code handling
- Timeout and network error handling

AUTHENTICATION:
- Bearer token authentication
- Token extraction from login responses
- Automatic header injection for authenticated requests
- Session management for test scenarios

RETRY LOGIC:
- Exponential backoff for failed operations
- Configurable retry attempts
- Operation isolation for retry
- Clear retry progress feedback

PERFORMANCE FEATURES:
- Timeout configuration for reliability
- Efficient request batching
- Minimal overhead operations
- Progress feedback for long operations

EXTENSIBILITY:
- Easy to add new API operations
- Configurable client settings
- Support for different authentication methods
- Compatible with different test frameworks
*/

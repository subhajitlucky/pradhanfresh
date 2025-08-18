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
  calculateOrderTotals,
  calculateItemSubtotal,
  calculateDeliveryFee
};

/*
=== ORDER CALCULATIONS MODULE ===

This module handles all financial calculations related to orders in the e-commerce system.

KEY FEATURES:
1. **Order Total Calculation**: Computes subtotal, tax, delivery fee, and final total
2. **Item Subtotal Calculation**: Calculates price × quantity for individual items
3. **Delivery Fee Logic**: Determines shipping charges based on order value and location
4. **Precision Handling**: Ensures accurate monetary calculations with proper rounding

CALCULATION LOGIC:

1. **Order Totals Flow**:
   - Subtotal = Sum of all item subtotals
   - Tax Amount = Subtotal × (Tax Percentage / 100)
   - Total = Subtotal + Delivery Fee + Tax - Discount

2. **Delivery Fee Rules**:
   - Free delivery for orders ≥ ₹500
   - Base delivery fee: ₹40 for smaller orders
   - Extensible for location-based pricing

3. **Rounding Strategy**:
   - All monetary values rounded to 2 decimal places
   - Uses Math.round(value * 100) / 100 for precision

USAGE EXAMPLES:
```javascript
const { calculateOrderTotals, calculateItemSubtotal, calculateDeliveryFee } = require('../utils/order/calculations');

// Calculate item subtotal
const itemTotal = calculateItemSubtotal(3, 199.99); // 3 × ₹199.99 = ₹599.97

// Calculate delivery fee
const deliveryFee = calculateDeliveryFee('400001', 350); // ₹40 (order < ₹500)
const freeDelivery = calculateDeliveryFee('400001', 600); // ₹0 (order ≥ ₹500)

// Calculate complete order totals
const orderItems = [
  { subtotal: 599.97 },
  { subtotal: 149.50 }
];
const totals = calculateOrderTotals(orderItems, {
  deliveryFee: 40,
  tax: 18, // 18% GST
  discount: 50
});
// Returns: { subtotal: 749.47, deliveryFee: 40, tax: 134.90, discount: 50, totalAmount: 874.37 }
```

EXTENSIBILITY:
- Delivery fee calculation can be enhanced with:
  - Location-based pricing (metro vs non-metro)
  - Weight-based shipping charges
  - Express delivery options
  - Partner-specific rates

BUSINESS RULES:
- Tax calculation supports percentage-based taxation (e.g., GST)
- Discount is applied as a flat amount reduction
- All calculations maintain monetary precision
- Free delivery threshold encourages larger orders
*/

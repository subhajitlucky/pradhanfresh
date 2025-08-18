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

module.exports = {
  getOrderStatusInfo
};

/*
=== ORDER STATUS INFORMATION MODULE ===

This module provides user-friendly display information for order statuses.

KEY FEATURES:
1. **Status Labels**: Human-readable status names
2. **Descriptions**: Clear explanations of what each status means
3. **Color Coding**: UI color suggestions for status display
4. **Cancellation Rules**: Indicates if orders can be cancelled in each state

STATUS INFORMATION STRUCTURE:
Each status returns an object with:
- `label`: Display name for the status
- `description`: User-friendly explanation
- `color`: Suggested UI color theme
- `canCancel`: Boolean indicating if cancellation is allowed

ORDER STATUS MEANINGS:

1. **PENDING** (Orange):
   - Order placed but not yet confirmed
   - Payment may be pending
   - Can be cancelled by user or admin

2. **CONFIRMED** (Blue):
   - Payment received and verified
   - Order approved and entered into fulfillment
   - Can still be cancelled before processing

3. **PROCESSING** (Purple):
   - Items being picked, packed, and prepared
   - Inventory allocated and reserved
   - Last chance for cancellation

4. **SHIPPED** (Indigo):
   - Order dispatched and in transit
   - Tracking information available
   - Cannot be cancelled (can only be returned)

5. **DELIVERED** (Green):
   - Order successfully delivered to customer
   - Confirmation of receipt
   - Can initiate return process

6. **CANCELLED** (Red):
   - Order terminated before fulfillment
   - Payment refunded (if applicable)
   - Terminal state - no further actions

7. **RETURNED** (Gray):
   - Order returned by customer
   - Refund processing completed
   - Terminal state - order lifecycle ended

USAGE EXAMPLES:
```javascript
const { getOrderStatusInfo } = require('../utils/order/statusInfo');

// Get status information for display
const statusInfo = getOrderStatusInfo('SHIPPED');
console.log(statusInfo);
// Output: {
//   label: 'Shipped',
//   description: 'Order is on the way to you',
//   color: 'indigo',
//   canCancel: false
// }

// Use in UI components
const renderOrderStatus = (order) => {
  const statusInfo = getOrderStatusInfo(order.status);
  return (
    <div className={`status-badge ${statusInfo.color}`}>
      <span className="label">{statusInfo.label}</span>
      <p className="description">{statusInfo.description}</p>
      {statusInfo.canCancel && <button>Cancel Order</button>}
    </div>
  );
};
```

UI INTEGRATION:
- Color suggestions work with CSS frameworks (Tailwind, Bootstrap)
- Can be used for status badges, progress indicators
- Description text suitable for tooltips or help text
- Cancellation flag enables conditional UI elements

BUSINESS RULES:
- Only pre-shipment orders can be cancelled
- Color coding follows standard e-commerce conventions
- Descriptions are customer-facing and non-technical
- Fallback handling for unknown status values

EXTENSIBILITY:
- Easy to add new status types
- Color scheme can be customized per brand
- Descriptions can be internationalized
- Additional properties can be added (icons, actions, etc.)
*/

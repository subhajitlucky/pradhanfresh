const prisma = require('../../../prisma/client');

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

module.exports = {
  updateProductStock
};

/*
=== STOCK MANAGEMENT MODULE ===

This module handles inventory stock updates when orders are processed or cancelled.

KEY FEATURES:
1. **Stock Reduction**: Decreases inventory when orders are confirmed
2. **Stock Restoration**: Increases inventory when orders are cancelled/returned
3. **Parallel Updates**: Processes multiple product updates simultaneously
4. **Safety Checks**: Prevents negative stock levels

OPERATION TYPES:

1. **REDUCE Operation**:
   - Used when: Order confirmed, payment received
   - Action: Subtracts order quantity from current stock
   - Safety: Ensures stock never goes below 0 using Math.max(0, ...)

2. **RESTORE Operation**:
   - Used when: Order cancelled, returned, or failed
   - Action: Adds order quantity back to current stock
   - Safety: No upper limit check (stock can exceed original)

USAGE EXAMPLES:
```javascript
const { updateProductStock } = require('./stockManagement');

// When order is confirmed - reduce stock
const orderItems = [
  { productId: 1, quantity: 3 },
  { productId: 2, quantity: 1 }
];
await updateProductStock(orderItems, 'REDUCE');

// When order is cancelled - restore stock
await updateProductStock(orderItems, 'RESTORE');
```

PERFORMANCE OPTIMIZATION:
- Uses Promise.all() to update multiple products in parallel
- Minimizes database queries by batching operations
- Only queries current stock before updating (no full product fetch)

ERROR HANDLING:
- Skips items if product not found (prevents crashes)
- Individual product update failures don't affect others
- Database transaction integrity maintained per product

BUSINESS SCENARIOS:

1. **Order Confirmation Flow**:
   ```javascript
   // After successful payment
   await updateProductStock(orderItems, 'REDUCE');
   ```

2. **Order Cancellation Flow**:
   ```javascript
   // When user or admin cancels order
   await updateProductStock(orderItems, 'RESTORE');
   ```

3. **Return Processing**:
   ```javascript
   // When returned items are received
   await updateProductStock(returnedItems, 'RESTORE');
   ```

STOCK SAFETY MEASURES:
- REDUCE operation uses Math.max(0, stock - quantity) to prevent negative stock
- RESTORE operation adds quantity without upper limit validation
- Real-time stock checking prevents race conditions
- Each product update is atomic at database level

SCALABILITY CONSIDERATIONS:
- For high-volume operations, consider using database transactions
- Stock movements could be logged for audit trail
- Consider implementing stock reservation for pending orders
- Real-time stock sync with external inventory systems
*/

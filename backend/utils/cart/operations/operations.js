// Re-export all cart operations from focused modules
const { getOrCreateCart } = require('./creation');
const { addItemToCart } = require('./itemManagement');
const { updateCartTotal, getFinalCartData } = require('../support/calculations');

module.exports = {
  getOrCreateCart,
  addItemToCart,
  updateCartTotal,
  getFinalCartData
};

/*
=== CART OPERATIONS MODULE ===

This module provides a unified interface for all cart operations.

AVAILABLE OPERATIONS:
- getOrCreateCart: Find or create user's cart
- addItemToCart: Add/update items in cart  
- updateCartTotal: Recalculate cart totals
- getFinalCartData: Get complete cart for responses

USAGE:
```javascript
const { getOrCreateCart, addItemToCart, updateCartTotal, getFinalCartData } = require('./operations');

// Complete cart operation flow
const cart = await getOrCreateCart(userId);
await addItemToCart({ cart, productId, quantity, product });
await updateCartTotal(cart.id);
const finalCart = await getFinalCartData(cart.id);
```

MODULAR DESIGN:
- creation.js: Cart creation and retrieval
- itemManagement.js: Adding/updating cart items
- calculations.js: Total calculations and data formatting
*/
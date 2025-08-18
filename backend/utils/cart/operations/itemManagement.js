const prisma = require('../../prisma/client');
const { validateStock, calculateSubtotal } = require('../cartUtils');

/**
 * Add or update item in cart
 * @param {Object} params - Parameters for adding item
 * @returns {Promise<Object>} Updated cart
 */
const addItemToCart = async ({ cart, productId, quantity, product }) => {
  const existingCartItem = cart.items.find(item => item.productId === productId);
  const currentPrice = product.salePrice || product.price;

  if (existingCartItem) {
    // Update existing item quantity
    const newQuantity = existingCartItem.quantity + quantity;
    
    // Validate total quantity against stock
    const totalStockValidation = await validateStock(productId, newQuantity);
    if (!totalStockValidation.valid) {
      throw new Error(totalStockValidation.message);
    }

    const newSubtotal = calculateSubtotal(newQuantity, currentPrice);

    await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: {
        quantity: newQuantity,
        price: currentPrice, // Update price in case it changed
        subtotal: newSubtotal,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Updated cart item: ${product.name} (${newQuantity} units)`);
  } else {
    // Add new item to cart
    const subtotal = calculateSubtotal(quantity, currentPrice);

    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: productId,
        quantity: quantity,
        price: currentPrice,
        subtotal: subtotal
      }
    });

    console.log(`✅ Added new item to cart: ${product.name} (${quantity} units)`);
  }
};

module.exports = {
  addItemToCart
};

/*
=== CART ITEM MANAGEMENT MODULE ===

This module handles adding and updating items in the cart.

KEY FUNCTIONALITY:
- Handles both new items and quantity updates for existing items
- Validates stock levels before adding/updating items
- Calculates subtotals and updates pricing
- Provides console logging for successful operations

BUSINESS LOGIC:
- Updates existing items by adding quantities together
- Validates total quantity against available stock
- Uses current product price (sale price if available, otherwise regular price)
- Automatically updates timestamps for audit trail

USAGE:
```javascript
const { addItemToCart } = require('./itemManagement');

await addItemToCart({
  cart: userCart,
  productId: 123,
  quantity: 2,
  product: productData
});
```

ERROR HANDLING:
- Throws error if insufficient stock available
- Database errors bubble up to calling functions
- Stock validation prevents overselling
*/

const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const requireAuth = require('../../middleware/requireAuth');
const { validateStock } = require('../../utils/cart/cartUtils');
const { validateAddToCartInput } = require('../../utils/cart/validation');
const { getOrCreateCart, addItemToCart, updateCartTotal, getFinalCartData } = require('../../utils/cart/operations');

// POST /api/cart/add - Add item to cart
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // === INPUT VALIDATION ===
    const validation = validateAddToCartInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        error: validation.error
      });
    }

    const { productId, quantity } = validation.data;

    // === GET PRODUCT DETAILS ===
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        price: true,
        salePrice: true,
        stock: true,
        isAvailable: true,
        thumbnail: true
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: 'Not Found'
      });
    }

    // === STOCK VALIDATION ===
    const stockValidation = await validateStock(productId, quantity);
    if (!stockValidation.valid) {
      return res.status(400).json({
        success: false,
        message: stockValidation.message,
        error: 'Stock Error'
      });
    }

    // === GET OR CREATE CART ===
    const cart = await getOrCreateCart(userId);

    // === ADD ITEM TO CART ===
    await addItemToCart({ cart, productId, quantity, product });

    // === RECALCULATE CART TOTAL ===
    await updateCartTotal(cart.id);

    // === GET FINAL CART DATA ===
    const finalCart = await getFinalCartData(cart.id);

    // === RETURN SUCCESS RESPONSE ===
    res.status(200).json({
      success: true,
      message: `${product.name} added to cart successfully`,
      data: {
        cart: finalCart,
        itemsCount: finalCart.items.length,
        totalAmount: finalCart.totalAmount
      }
    });

  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;

/*
=== ADD TO CART ROUTE HANDLER ===

This route handler manages the addition of items to a user's shopping cart.
The original large file has been refactored to use modular utility functions.

ROUTE INFORMATION:
- Method: POST
- Path: /api/cart/add
- Authentication: Required (uses requireAuth middleware)
- Purpose: Add products to user's cart or update quantities

REQUEST FLOW:
1. **Authentication Check** - Middleware validates user token
2. **Input Validation** - Validates productId and quantity
3. **Product Lookup** - Verifies product exists and gets details
4. **Stock Validation** - Ensures sufficient inventory
5. **Cart Management** - Gets existing cart or creates new one
6. **Item Addition** - Adds item or updates existing quantity
7. **Total Calculation** - Recalculates cart totals
8. **Response** - Returns updated cart data

REQUEST BODY:
{
  productId: 123,
  quantity: 2
}

SUCCESS RESPONSE:
{
  success: true,
  message: "Product name added to cart successfully",
  data: {
    cart: { complete cart object },
    itemsCount: 3,
    totalAmount: 899.50
  }
}

ERROR RESPONSES:
- 400: Invalid input, insufficient stock, validation errors
- 404: Product not found
- 500: Server errors

BUSINESS RULES ENFORCED:
- Maximum 99 items per product
- Only available products can be added
- Stock levels are validated in real-time
- Cart expiry is extended on each activity
- Existing items have quantities updated, not duplicated

MODULAR DESIGN BENEFITS:
- **Validation Module**: Clean separation of input validation logic
- **Operations Module**: Reusable cart business logic
- **Reduced Complexity**: Route handler focuses only on HTTP concerns
- **Better Testing**: Each module can be unit tested independently
- **Improved Maintainability**: Changes to business logic don't affect routing

SECURITY FEATURES:
- Authentication required for all operations
- Input validation prevents malicious data
- Stock validation prevents overselling
- Error messages don't expose sensitive information

PERFORMANCE CONSIDERATIONS:
- Single database queries for cart operations
- Efficient product lookup with selected fields
- Atomic operations prevent race conditions
- Proper error handling prevents crashes

EXTENSIBILITY:
- Easy to add new validation rules
- Cart operations can be reused in other routes
- Response format can be standardized across cart endpoints
- Business logic changes don't require route modifications
*/
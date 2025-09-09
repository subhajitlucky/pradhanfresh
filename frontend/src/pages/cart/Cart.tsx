import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './../../styles/cart/Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { 
    cart, 
    loading, 
    error, 
    updateCartItem, 
    removeFromCart, 
    clearCart,
    getCartItemsCount,
    getCartTotal 
  } = useCart();

  const [updating, setUpdating] = useState<{ [key: number]: boolean }>({});

  // Handle quantity change
  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      return;
    }

    setUpdating(prev => ({ ...prev, [itemId]: true }));
    
    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Handle item removal
  const handleRemoveItem = async (itemId: number) => {
    setUpdating(prev => ({ ...prev, [itemId]: true }));
    
    try {
      await removeFromCart(itemId);
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Handle clear cart
  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };

  // Navigate to checkout
  const handleCheckout = () => {
    navigate('/checkout');
  };

  // Navigate to continue shopping
  const handleContinueShopping = () => {
    navigate('/products');
  };

  // Display price with discount
  const displayPrice = (price: number, salePrice: number | null) => {
    if (salePrice) {
      return (
        <div className="item-price-container">
          <span className="item-sale-price">₹{salePrice.toFixed(2)}</span>
          <span className="item-original-price">₹{price.toFixed(2)}</span>
        </div>
      );
    }
    return <span className="item-price">₹{price.toFixed(2)}</span>;
  };

  return (
    <div className="cart-page">
      <div className="cart-container">
        {/* Cart Header */}
        <div className="cart-header">
          <h1>Shopping Cart</h1>
          <button 
            onClick={handleContinueShopping} 
            className="continue-shopping-btn"
          >
            ← Continue Shopping
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="cart-loading">
            <div className="loading-spinner"></div>
            <p>Loading your cart...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="cart-error">
            <h2>Error Loading Cart</h2>
            <p>{error}</p>
          </div>
        )}

        {/* Empty Cart State */}
        {!loading && !error && (!cart || cart.items.length === 0) && (
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add some fresh products to your cart to get started!</p>
            <button 
              onClick={handleContinueShopping}
              className="shop-now-btn"
            >
              Start Shopping
            </button>
          </div>
        )}

        {/* Cart Content */}
        {!loading && !error && cart && cart.items.length > 0 && (
          <div className="cart-content">
            {/* Cart Summary Header */}
            <div className="cart-summary-header">
              <span className="items-count">
                {getCartItemsCount()} item{getCartItemsCount() !== 1 ? 's' : ''} in your cart
              </span>
              <button 
                onClick={handleClearCart}
                className="clear-cart-btn"
              >
                Clear Cart
              </button>
            </div>

            {/* Cart Items */}
            <div className="cart-items">
              {cart.items.map((item) => (
                <div key={item.id} className="cart-item">
                  {/* Item Image */}
                  <div className="item-image-container">
                    <img 
                      src={item.product.thumbnail} 
                      alt={item.product.name}
                      className="item-image"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="item-details">
                    <h3 className="item-name">{item.product.name}</h3>
                    <p className="item-unit">per {item.product.unit}</p>
                    <div className="item-pricing">
                      {displayPrice(item.product.price, item.product.salePrice)}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="quantity-controls">
                    <button 
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || updating[item.id]}
                      className="quantity-btn decrease"
                    >
                      -
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={updating[item.id] || item.quantity >= item.product.stock}
                      className="quantity-btn increase"
                    >
                      +
                    </button>
                  </div>

                  {/* Item Subtotal */}
                  <div className="item-subtotal">
                    <span className="subtotal-amount">₹{item.subtotal.toFixed(2)}</span>
                  </div>

                  {/* Remove Button */}
                  <div className="item-actions">
                    <button 
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={updating[item.id]}
                      className="remove-item-btn"
                    >
                      {updating[item.id] ? '...' : '×'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="cart-summary">
              <div className="summary-row">
                <span className="summary-label">Subtotal:</span>
                <span className="summary-value">₹{getCartTotal().toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Delivery Fee:</span>
                <span className="summary-value">₹50.00</span>
              </div>
              <div className="summary-row total">
                <span className="summary-label">Total:</span>
                <span className="summary-value">₹{(getCartTotal() + 50).toFixed(2)}</span>
              </div>

              {/* Checkout Button */}
              <button 
                onClick={handleCheckout}
                className="checkout-btn"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartApi } from '../utils/cartApi';

// TypeScript interfaces for cart data
interface Product {
  id: number;
  name: string;
  thumbnail: string;
  price: number;
  salePrice: number | null;
  unit: string;
  stock: number;
  isAvailable: boolean;
}

interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  subtotal: number;
  product: Product;
}

interface Cart {
  id: number;
  items: CartItem[];
  totalAmount: number;
  itemsCount: number;
}

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  
  // Cart actions
  addToCart: (productId: number, quantity: number) => Promise<boolean>;
  updateCartItem: (itemId: number, quantity: number) => Promise<boolean>;
  removeFromCart: (itemId: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  fetchCart: () => Promise<void>;
  
  // Helper functions
  getCartItemsCount: () => number;
  getCartTotal: () => number;
  isInCart: (productId: number) => boolean;
  getCartItem: (productId: number) => CartItem | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart from backend
  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await cartApi.getCart();
      if (response.success && response.data) {
        setCart({
          id: response.data.id,
          items: response.data.items,
          totalAmount: response.data.totalAmount,
          itemsCount: response.data.items.length
        });
      } else {
        // Cart might be empty
        setCart(null);
      }
    } catch (error: unknown) {
      console.error('Error fetching cart:', error);
      if (error.response?.status !== 404) {
        setError('Failed to load cart');
      }
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (productId: number, quantity: number = 1): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await cartApi.addToCart(productId, quantity);
      if (response.success && response.data) {
        setCart({
          id: response.data.cart.id,
          items: response.data.cart.items,
          totalAmount: response.data.totalAmount,
          itemsCount: response.data.itemsCount
        });
        return true;
      } else {
        setError(response.message || 'Failed to add item to cart');
        return false;
      }
    } catch (error: unknown) {
      console.error('Error adding to cart:', error);
      setError(error.response?.data?.message || 'Failed to add item to cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update cart item quantity
  const updateCartItem = async (itemId: number, quantity: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await cartApi.updateCartItem(itemId, quantity);
      if (response.success && response.data) {
        setCart({
          id: response.data.cart.id,
          items: response.data.cart.items,
          totalAmount: response.data.totalAmount,
          itemsCount: response.data.itemsCount
        });
        return true;
      } else {
        setError(response.message || 'Failed to update cart item');
        return false;
      }
    } catch (error: unknown) {
      console.error('Error updating cart item:', error);
      setError(error.response?.data?.message || 'Failed to update cart item');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await cartApi.removeFromCart(itemId);
      if (response.success) {
        // Refresh cart after removal
        await fetchCart();
        return true;
      } else {
        setError(response.message || 'Failed to remove item from cart');
        return false;
      }
    } catch (error: unknown) {
      console.error('Error removing from cart:', error);
      setError(error.response?.data?.message || 'Failed to remove item from cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await cartApi.clearCart();
      if (response.success) {
        setCart(null);
        return true;
      } else {
        setError(response.message || 'Failed to clear cart');
        return false;
      }
    } catch (error: unknown) {
      console.error('Error clearing cart:', error);
      setError(error.response?.data?.message || 'Failed to clear cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getCartItemsCount = (): number => {
    return cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;
  };

  const getCartTotal = (): number => {
    return cart?.totalAmount || 0;
  };

  const isInCart = (productId: number): boolean => {
    return cart?.items.some(item => item.productId === productId) || false;
  };

  const getCartItem = (productId: number): CartItem | undefined => {
    return cart?.items.find(item => item.productId === productId);
  };

  // Load cart on mount
  useEffect(() => {
    fetchCart();
  }, []);

  const value: CartContextType = {
    cart,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    fetchCart,
    getCartItemsCount,
    getCartTotal,
    isInCart,
    getCartItem
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;

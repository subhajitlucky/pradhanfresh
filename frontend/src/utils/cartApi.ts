import api from './api';

// TypeScript interfaces for API responses
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

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
}

interface AddToCartResponse {
  cart: Cart;
  itemsCount: number;
  totalAmount: number;
}

interface UpdateCartResponse {
  cart: Cart;
  itemsCount: number;
  totalAmount: number;
}

// Cart API service functions
export const cartApi = {
  // GET /api/cart - Get user's cart
  async getCart(): Promise<ApiResponse<Cart>> {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching cart:', error);
      throw error;
    }
  },

  // POST /api/cart/add - Add item to cart
  async addToCart(productId: number, quantity: number): Promise<ApiResponse<AddToCartResponse>> {
    try {
      const requestData = { productId, quantity };
      console.log('📦 Adding to cart:', requestData);
      
      const response = await api.post('/cart/add', requestData);
      console.log('✅ Add to cart response:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error adding to cart:', error);
      throw error;
    }
  },

  // PUT /api/cart/:itemId - Update cart item quantity
  async updateCartItem(itemId: number, quantity: number): Promise<ApiResponse<UpdateCartResponse>> {
    try {
      const requestData = { quantity };
      console.log(`📝 Updating cart item ${itemId}:`, requestData);
      
      const response = await api.put(`/cart/${itemId}`, requestData);
      console.log('✅ Update cart item response:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error updating cart item:', error);
      throw error;
    }
  },

  // DELETE /api/cart/:itemId - Remove item from cart
  async removeFromCart(itemId: number): Promise<ApiResponse> {
    try {
      console.log(`🗑️ Removing cart item ${itemId}`);
      
      const response = await api.delete(`/cart/${itemId}`);
      console.log('✅ Remove from cart response:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error removing from cart:', error);
      throw error;
    }
  },

  // DELETE /api/cart/clear - Clear entire cart
  async clearCart(): Promise<ApiResponse> {
    try {
      console.log('🧹 Clearing entire cart');
      
      const response = await api.delete('/cart/clear');
      console.log('✅ Clear cart response:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error clearing cart:', error);
      throw error;
    }
  }
};

// Helper function to format price display
export const formatPrice = (price: number): string => {
  return `₹${price.toFixed(2)}`;
};

// Helper function to calculate discount percentage
export const calculateDiscountPercentage = (originalPrice: number, salePrice: number): number => {
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

// Helper function to get effective price (sale price or regular price)
export const getEffectivePrice = (price: number, salePrice: number | null): number => {
  return salePrice || price;
};

export default cartApi;

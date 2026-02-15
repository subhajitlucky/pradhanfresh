import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShoppingBag,
  Truck,
  ShieldCheck
} from 'lucide-react';
import { useCart } from '../../context/CartContext';

const Cart = () => {
  const navigate = useNavigate();
  const {
    cart,
    loading,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartItemsCount,
    getCartTotal
  } = useCart();

  const [updating, setUpdating] = useState<{ [key: number]: boolean }>({});

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdating(prev => ({ ...prev, [itemId]: true }));
    await updateCartItem(itemId, newQuantity);
    setUpdating(prev => ({ ...prev, [itemId]: false }));
  };

  if (loading) return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4">
      <div className="h-10 w-48 bg-gray-100 rounded-xl animate-pulse mb-8" />
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-50 rounded-[32px] animate-pulse" />)}
        </div>
        <div className="h-96 bg-gray-50 rounded-[32px] animate-pulse" />
      </div>
    </div>
  );

  if (!cart || cart.items.length === 0) return (
    <div className="pt-40 pb-40 flex flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-primary-50 rounded-[32px] flex items-center justify-center text-primary-600 mb-8"
      >
        <ShoppingBag size={48} />
      </motion.div>
      <h2 className="text-3xl font-black text-gray-900 mb-4">Your basket is empty</h2>
      <p className="text-gray-500 mb-10 italic max-w-sm">
        Looks like you haven't added any fresh produce to your basket yet.
      </p>
      <Link
        to="/products"
        className="px-10 py-5 bg-primary-600 text-white rounded-3xl font-black shadow-xl shadow-primary-200 hover:bg-primary-700 hover:-translate-y-1 transition-all"
      >
        Start Shopping
      </Link>
    </div>
  );

  return (
    <div className="pt-28 pb-24 bg-gray-50/30 min-h-screen px-4">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Shopping Basket</h1>
            <p className="text-gray-500 font-bold italic flex items-center gap-2">
              <ShoppingBag size={18} className="text-primary-600" />
              You have {getCartItemsCount()} items in your basket
            </p>
          </div>
          <button
            onClick={() => clearCart()}
            className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors italic"
          >
            Clear all items
          </button>
        </header>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="popLayout">
              {cart.items.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  key={item.id}
                  className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row items-center gap-6 group"
                >
                  <div className="w-32 h-32 rounded-3xl overflow-hidden bg-gray-50 shrink-0">
                    <img src={item.product.thumbnail} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>

                  <div className="grow space-y-1 text-center sm:text-left">
                    <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest italic">{item.product.category.name}</p>
                    <h3 className="text-xl font-black text-gray-900">{item.product.name}</h3>
                    <p className="text-sm text-gray-400 font-bold italic">₹{item.product.salePrice || item.product.price} / {item.product.unit}</p>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center bg-gray-100 rounded-2xl p-1">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || updating[item.id]}
                      className="p-2 hover:bg-white rounded-xl transition-all text-gray-500 disabled:opacity-30"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-10 text-center font-black text-lg">
                      {updating[item.id] ? '...' : item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={updating[item.id] || item.quantity >= item.product.stock}
                      className="p-2 hover:bg-white rounded-xl transition-all text-gray-500 disabled:opacity-30"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="w-24 text-right">
                    <p className="text-xl font-black text-gray-900 italic">₹{item.subtotal.toFixed(2)}</p>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <aside className="space-y-6 sticky top-28">
            <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-xl shadow-gray-200/50">
              <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight italic">Order Summary</h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm font-bold text-gray-400 italic">
                  <span>Subtotal</span>
                  <span className="text-gray-900 font-black">₹{getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-400 italic">
                  <span>Delivery</span>
                  <span className="text-emerald-500 font-black">Free</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-400 italic">
                  <span>Taxes</span>
                  <span className="text-gray-900 font-black">₹0.00</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 mb-10">
                <div className="flex justify-between items-end italic">
                  <span className="text-lg font-black text-gray-900">Total</span>
                  <span className="text-4xl font-black text-primary-600">₹{getCartTotal().toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-6 bg-primary-600 text-white rounded-[32px] font-black text-xl shadow-2xl shadow-primary-100 hover:bg-primary-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
              >
                Checkout <ArrowRight size={24} />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 px-4 italic">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400">
                  <Truck size={24} />
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Express Delivery</p>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400">
                  <ShieldCheck size={24} />
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secure Checkout</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Cart;

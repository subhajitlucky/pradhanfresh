import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  MapPin,
  Clock,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  ShoppingBag,
  Leaf
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { cn } from '../../utils/cn';

const Checkout: React.FC = () => {
  const { cart, clearCart, getCartTotal } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [deliverySlot, setDeliverySlot] = useState('MORNING');

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    // Premium success transition
    setIsSuccess(true);
    setTimeout(() => {
      clearCart();
    }, 500);
  };

  if (!cart || cart.items.length === 0 && !isSuccess) {
    return (
      <div className="pt-40 pb-40 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-6">
          <ShoppingBag size={40} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Checkout is empty</h2>
        <button
          onClick={() => navigate('/products')}
          className="text-primary-600 font-bold hover:underline"
        >
          Go back to shopping
        </button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="pt-32 pb-24 px-4 flex items-center justify-center min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-8 bg-white p-12 rounded-[60px] shadow-2xl shadow-primary-100 border border-gray-50"
        >
          <div className="relative w-24 h-24 mx-auto">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="absolute inset-0 bg-primary-600 rounded-full flex items-center justify-center text-white"
            >
              <CheckCircle2 size={48} />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-primary-200 rounded-full -z-10"
            />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Order Placed!</h2>
            <p className="text-gray-500 italic max-w-xs mx-auto">
              Your fresh produce is being handpicked right now. You'll receive an SMS update shortly.
            </p>
          </div>
          <div className="pt-4 space-y-3">
            <Link
              to="/profile"
              className="block w-full py-5 bg-gray-900 text-white rounded-3xl font-black hover:bg-gray-800 transition-all"
            >
              Track my Order
            </Link>
            <Link
              to="/"
              className="block w-full py-5 text-gray-400 font-bold hover:text-primary-600 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const steps = [
    { id: 1, name: 'Address', icon: MapPin },
    { id: 2, name: 'Delivery', icon: Clock },
    { id: 3, name: 'Payment', icon: CreditCard },
  ];

  return (
    <div className="pt-28 pb-24 px-4 bg-gray-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
        {/* Main Checkout Flow */}
        <div className="grow lg:max-w-2xl mx-auto w-full">
          {/* Back btn */}
          <button
            onClick={() => navigate('/cart')}
            className="mb-8 flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-primary-600 transition-colors group italic"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back to Cart
          </button>

          {/* Stepper */}
          <div className="flex justify-between mb-16 relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -z-10 -translate-y-1/2" />
            {steps.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-3">
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-4 border-white shadow-lg",
                    step >= s.id ? "bg-primary-600 text-white scale-110" : "bg-gray-100 text-gray-400"
                  )}
                >
                  <s.icon size={24} />
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest italic",
                  step >= s.id ? "text-primary-600" : "text-gray-400"
                )}>
                  {s.name}
                </span>
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="bg-white rounded-[40px] p-8 md:p-12 border border-gray-100 shadow-sm relative overflow-hidden">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight italic">Where should we deliver?</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Full Name</label>
                      <input name="fullName" placeholder="Rahul Sharma" value={address.fullName} onChange={handleAddressChange} className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary-100 focus:ring-4 focus:ring-primary-50 px-outline-none transition-all placeholder:text-gray-300 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Phone</label>
                      <input name="phone" placeholder="+91 98765 43210" value={address.phone} onChange={handleAddressChange} className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary-100 focus:ring-4 focus:ring-primary-50 px-outline-none transition-all placeholder:text-gray-300 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">City</label>
                      <input name="city" placeholder="Mumbai" value={address.city} onChange={handleAddressChange} className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary-100 focus:ring-4 focus:ring-primary-50 px-outline-none transition-all placeholder:text-gray-300 font-bold" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Full Address</label>
                      <input name="addressLine1" placeholder="Flat No, Building, Area" value={address.addressLine1} onChange={handleAddressChange} className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-primary-100 focus:ring-4 focus:ring-primary-50 px-outline-none transition-all placeholder:text-gray-300 font-bold" />
                    </div>
                  </div>
                  <button onClick={handleNext} className="w-full py-6 bg-primary-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-primary-100 hover:bg-primary-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                    Continue to Delivery <ArrowRight size={20} />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight italic">Select your slot</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { id: 'MORNING', time: '07:00 AM - 11:00 AM', label: 'Fresh Morning' },
                      { id: 'AFTERNOON', time: '12:00 PM - 04:00 PM', label: 'Midday Delivery' },
                      { id: 'EVENING', time: '06:00 PM - 09:00 PM', label: 'Evening Fresh' },
                    ].map(slot => (
                      <div
                        key={slot.id}
                        onClick={() => setDeliverySlot(slot.id)}
                        className={cn(
                          "p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                          deliverySlot === slot.id ? "bg-primary-50 border-primary-600 shadow-lg shadow-primary-50" : "bg-white border-gray-100 hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", deliverySlot === slot.id ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-400")}>
                            <Clock size={20} />
                          </div>
                          <div>
                            <p className="font-black text-gray-900">{slot.label}</p>
                            <p className="text-sm text-gray-500 italic">{slot.time}</p>
                          </div>
                        </div>
                        {deliverySlot === slot.id && <CheckCircle2 className="text-primary-600" size={24} />}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <button onClick={handleBack} className="flex-1 py-5 border border-gray-100 rounded-3xl font-bold text-gray-400 hover:bg-gray-50 transition-all">Back</button>
                    <button onClick={handleNext} className="flex-[2] py-5 bg-primary-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-primary-100 hover:bg-primary-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                      Review Summary <ArrowRight size={20} />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight italic">Review & Pay</h2>
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-[32px] space-y-4 italic">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <MapPin size={14} /> Deliver To
                        </p>
                        <button onClick={() => setStep(1)} className="text-xs font-bold text-primary-600 hover:underline">Change</button>
                      </div>
                      <p className="text-sm font-bold text-gray-700">{address.fullName}, {address.addressLine1}, {address.city}</p>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-[32px] space-y-4 italic">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Clock size={14} /> Scheduled At
                        </p>
                        <button onClick={() => setStep(2)} className="text-xs font-bold text-primary-600 hover:underline">Change</button>
                      </div>
                      <p className="text-sm font-bold text-gray-700">{deliverySlot} Slot</p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">Choose Method</p>
                      <div className="grid grid-cols-2 gap-4">
                        <button className="p-6 rounded-[32px] border-2 border-primary-600 bg-primary-50 flex flex-col items-center gap-2">
                          <ShieldCheck className="text-primary-600" size={24} />
                          <span className="text-sm font-bold italic">Cash On Delivery</span>
                        </button>
                        <button disabled className="p-6 rounded-[32px] border-2 border-gray-50 bg-gray-50 opacity-40 flex flex-col items-center gap-2 cursor-not-allowed grayscale">
                          <CreditCard className="text-gray-400" size={24} />
                          <span className="text-sm font-bold italic">Card / UPI</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={handleBack} className="flex-1 py-5 border border-gray-100 rounded-3xl font-bold text-gray-400 hover:bg-gray-50 transition-all">Back</button>
                    <button onClick={handleSubmit} className="flex-[2] py-5 bg-gray-900 text-white rounded-3xl font-black text-lg shadow-2xl hover:bg-black hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                      Place Order <ArrowRight size={20} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mini Summary Sidebar */}
        <aside className="lg:w-96 shrink-0 space-y-6">
          <div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm sticky top-28 italic">
            <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">
              <ShoppingBag size={20} className="text-primary-600" />
              Your Items
            </h3>
            <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 scrollbar-none mb-8">
              {cart.items.map(item => (
                <div key={item.id} className="flex items-center gap-4">
                  <img src={item.product.thumbnail} alt={item.product.name} className="w-14 h-14 rounded-2xl object-cover bg-gray-50" />
                  <div className="grow">
                    <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-gray-400 font-bold">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-black text-gray-900">₹{item.subtotal}</p>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-dotted border-gray-200 space-y-4">
              <div className="flex justify-between text-sm font-bold text-gray-400">
                <span>Subtotal</span>
                <span className="text-gray-900 font-black">₹{getCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-gray-900">
                <span>Total Amount</span>
                <span className="text-primary-600">₹{getCartTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 p-6 rounded-[32px] flex items-center gap-4 border border-emerald-100 italic">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <Leaf size={20} />
            </div>
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest leading-normal">
              Carbon-neutral delivery on all orders today!
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;

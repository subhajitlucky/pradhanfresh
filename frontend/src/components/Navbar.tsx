import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBasket,
  User,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  LayoutDashboard,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { cn } from '../utils/cn';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { getCartItemsCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-3",
        isScrolled
          ? "bg-white/80 backdrop-blur-md shadow-sm py-2"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 group transition-transform hover:scale-105"
        >
          <div className="bg-primary-600 p-2 rounded-xl text-white shadow-lg shadow-primary-200">
            <ShoppingBasket size={24} />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
            PradhanFresh
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary-600",
                location.pathname === link.path ? "text-primary-600" : "text-gray-600"
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <button className="p-2 text-gray-500 hover:text-primary-600 transition-colors hidden sm:block">
            <Search size={20} />
          </button>

          <Link
            to="/cart"
            className="p-2 text-gray-600 hover:text-primary-600 transition-colors relative"
          >
            <ShoppingCart size={22} />
            {getCartItemsCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                {getCartItemsCount()}
              </span>
            )}
          </Link>

          <div className="hidden md:flex items-center gap-2 ml-2">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <User size={18} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{user.name.split(' ')[0]}</span>
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin/dashboard"
                    className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                    title="Admin Dashboard"
                  >
                    <LayoutDashboard size={22} />
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut size={22} />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors px-4 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-medium bg-primary-600 text-white px-6 py-2.5 rounded-full shadow-lg shadow-primary-200 hover:bg-primary-700 hover:-translate-y-0.5 transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="flex flex-col gap-4 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "text-lg font-medium py-2 px-4 rounded-xl transition-colors",
                    location.pathname === link.path
                      ? "bg-primary-50 text-primary-600"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <hr className="border-gray-100 my-2" />
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 py-2 px-4 rounded-xl text-gray-600"
                  >
                    <User size={20} /> Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 py-2 px-4 rounded-xl text-red-600"
                  >
                    <LogOut size={20} /> Logout
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center py-3 rounded-xl border border-gray-200 font-medium text-gray-600"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center py-3 rounded-xl bg-primary-600 text-white font-medium shadow-lg shadow-primary-100"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
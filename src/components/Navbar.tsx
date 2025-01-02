import { Link } from 'react-router-dom';
import { useState } from 'react';
import Login from './Login';
import logoImage from '@/assets/images/logo.jpg';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <nav className="bg-primary-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <img 
                className="h-12 w-auto rounded-full" 
                src={logoImage} 
                alt="PradhanFresh"
                width={48}
                height={48}
                loading="lazy"
              />
            </Link>
            <span className="ml-2 text-2xl font-bold">PradhanFresh</span>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className="hover:bg-primary-600 px-3 py-2 rounded-md text-lg font-medium">Home</Link>
              <Link to="/about" className="hover:bg-primary-600 px-3 py-2 rounded-md text-lg font-medium">About Us</Link>
              <Link to="/products" className="hover:bg-primary-600 px-3 py-2 rounded-md text-lg font-medium">Products</Link>
              <Link to="/contact" className="hover:bg-primary-600 px-3 py-2 rounded-md text-lg font-medium">Contact</Link>
              <button onClick={() => setShowLogin(true)} className="bg-secondary-500 hover:bg-secondary-600 px-3 py-2 rounded-md text-lg font-medium transition-colors">Login</button>
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-primary-200 hover:text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="hover:bg-primary-600 block px-3 py-2 rounded-md text-lg font-medium">Home</Link>
            <Link to="/about" className="hover:bg-primary-600 block px-3 py-2 rounded-md text-lg font-medium">About Us</Link>
            <Link to="/products" className="hover:bg-primary-600 block px-3 py-2 rounded-md text-lg font-medium">Products</Link>
            <Link to="/contact" className="hover:bg-primary-600 block px-3 py-2 rounded-md text-lg font-medium">Contact</Link>
            <button onClick={() => setShowLogin(true)} className="w-full text-left bg-secondary-500 hover:bg-secondary-600 block px-3 py-2 rounded-md text-lg font-medium">Login</button>
          </div>
        </div>
      )}
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </nav>
  );
};

export default Navbar;
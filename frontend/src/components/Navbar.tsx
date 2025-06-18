import { Link } from 'react-router-dom';
import { useState } from 'react';
import Login from './Login';
import logoImage from '@/assets/images/logo.jpg';
import '../styles/components.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <div className="navbar-brand">
            <Link to="/" className="navbar-brand">
              <img 
                className="navbar-logo" 
                src={logoImage} 
                alt="PradhanFresh"
                width={48}
                height={48}
                loading="lazy"
              />
              <span className="navbar-title">PradhanFresh</span>
            </Link>
          </div>
          <div className="navbar-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/about" className="nav-link">About Us</Link>
            <Link to="/products" className="nav-link">Products</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
            <button onClick={() => setShowLogin(true)} className="nav-button">Login</button>
          </div>
          <div className="mobile-menu-toggle">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="mobile-menu-toggle"
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
      <div className={`mobile-menu ${isOpen ? 'active' : ''}`}>
        <div className="mobile-menu-content">
          <Link to="/" className="mobile-nav-link">Home</Link>
          <Link to="/about" className="mobile-nav-link">About Us</Link>
          <Link to="/products" className="mobile-nav-link">Products</Link>
          <Link to="/contact" className="mobile-nav-link">Contact</Link>
          <button onClick={() => setShowLogin(true)} className="mobile-nav-button">Login</button>
        </div>
      </div>
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </nav>
  );
};

export default Navbar;
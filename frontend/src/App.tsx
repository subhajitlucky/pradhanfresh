import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

// Context Providers
import { CartProvider } from './context/CartContext';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Products from './pages/products/Products';
import ProductDetail from './pages/products/ProductDetail';
import Contact from './pages/public/Contact';

// Cart Pages
import Cart from './pages/cart/Cart';

// Auth Pages  
import Signup from './pages/auth/Signup';
import Login from './pages/auth/Login';
import Profile from './pages/auth/Profile';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import EmailVerified from './pages/auth/EmailVerified';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProductForm from './pages/admin/ProductForm';

// Organized Styles
import './styles/index.css';

function App() {
  return (
    <Router>
      <CartProvider>
        <div className="app-container">
          <Navbar />
          <main className="app-main">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/cart" element={<Cart />} />
              
              {/* Auth Routes */}
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/email-verified/:token" element={<EmailVerified />} />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminDashboard />} />
              <Route path="/admin/products/new" element={<AdminProductForm />} />
              <Route path="/admin/products/edit/:id" element={<AdminProductForm />} />
              <Route path="/admin/categories" element={<AdminDashboard />} />
            </Routes>
          </main>
          <footer className="app-footer">
            <div className="app-footer-content">
             
              <div className="app-footer-divider"></div>
              <p className="app-footer-copyright">&copy; 2023 PradhanFresh. All rights reserved.</p>
              <p className="app-footer-tagline">Bringing fresh, local produce to your doorstep.</p>
            </div>
          </footer>
        </div>
      </CartProvider>
    </Router>
  );
}

export default App;


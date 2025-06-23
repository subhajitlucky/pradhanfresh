import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Products from './pages/Products';
import Contact from './pages/Contact';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmailVerified from './pages/EmailVerified';
import { Link } from 'react-router-dom';

import './styles/app.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/products" element={<Products />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/email-verified/:token" element={<EmailVerified />} />
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
    </Router>
  );
}

export default App;


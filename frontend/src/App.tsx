import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Products from './pages/Products';
import Contact from './pages/Contact';

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
            
          </Routes>
        </main>
        <footer className="app-footer">
          <div className="app-footer-content">
            <p className="app-footer-copyright">&copy; 2023 PradhanFresh. All rights reserved.</p>
            <p className="app-footer-tagline">Bringing fresh, local produce to your doorstep.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;


import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Products from './pages/Products';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen font-sans">
        <Navbar />
        <main className="flex-grow bg-primary-50">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/products" element={<Products />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
        <footer className="bg-primary-800 text-white py-8 text-center">
          <div className="container mx-auto px-4">
            <p className="mb-2">&copy; 2023 PradhanFresh. All rights reserved.</p>
            <p className="text-sm">Bringing fresh, local produce to your doorstep.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;


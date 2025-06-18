import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/admin.css';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  availability: boolean;
}

const AdminDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    description: '',
    category: '',
    image: '',
    availability: true,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchProducts();
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get<Product[]>('http://localhost:3001/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/products', newProduct);
      fetchProducts();
      setNewProduct({
        name: '',
        price: 0,
        description: '',
        category: '',
        image: '',
        availability: true,
      });
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:3001/products/${id}`);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
      fetchProducts();
    } else {
      alert('Invalid password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuth');
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-container">
        <div className="admin-login-wrapper">
          <h1 className="admin-login-title">Admin Login</h1>
          <form onSubmit={handleLogin}>
            <div className="admin-form-group">
              <label htmlFor="password" className="admin-form-label">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-form-input"
                required
              />
            </div>
            <button type="submit" className="admin-login-button">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <button onClick={handleLogout} className="admin-logout-button">
          Logout
        </button>
      </div>
      <div className="admin-content-wrapper">
        <h2 className="admin-section-title">Add New Product</h2>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form-group">
            <label htmlFor="name" className="admin-form-label">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={newProduct.name}
              onChange={handleInputChange}
              className="admin-form-input"
              required
            />
          </div>
          <div className="admin-form-group">
            <label htmlFor="price" className="admin-form-label">Price</label>
            <input
              type="number"
              id="price"
              name="price"
              value={newProduct.price}
              onChange={handleInputChange}
              className="admin-form-input"
              required
            />
          </div>
          <div className="admin-form-group">
            <label htmlFor="description" className="admin-form-label">Description</label>
            <textarea
              id="description"
              name="description"
              value={newProduct.description}
              onChange={handleInputChange}
              className="admin-form-textarea"
              rows={4}
              required
            ></textarea>
          </div>
          <div className="admin-form-group">
            <label htmlFor="category" className="admin-form-label">Category</label>
            <select
              id="category"
              name="category"
              value={newProduct.category}
              onChange={handleInputChange}
              className="admin-form-select"
              required
            >
              <option value="">Select a category</option>
              <option value="fruits">Fruits</option>
              <option value="vegetables">Vegetables</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label htmlFor="image" className="admin-form-label">Image URL</label>
            <input
              type="text"
              id="image"
              name="image"
              value={newProduct.image}
              onChange={handleInputChange}
              className="admin-form-input"
              required
            />
          </div>
          <div className="admin-form-group">
            <label htmlFor="availability" className="admin-checkbox-label">
              <input
                type="checkbox"
                id="availability"
                name="availability"
                checked={newProduct.availability}
                onChange={handleInputChange}
                className="admin-checkbox"
              />
              Available
            </label>
          </div>
          <button type="submit" className="admin-add-button">
            Add Product
          </button>
        </form>

        <h2 className="admin-section-title">Manage Products</h2>
        <ul className="admin-products-list">
          {products.map((product) => (
            <li key={product.id} className="admin-product-item">
              <div className="admin-product-info">
                <p className="admin-product-name">{product.name}</p>
                <p>${product.price.toFixed(2)}</p>
              </div>
              <button
                onClick={() => handleDelete(product.id)}
                className="admin-delete-button"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminDashboard;


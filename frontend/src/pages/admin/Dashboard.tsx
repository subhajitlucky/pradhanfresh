import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  price: number;
  salePrice: number | null;
  categoryId: number;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  images: string[];
  thumbnail: string;
  stock: number;
  isAvailable: boolean;
  sku: string;
  unit: string;
  weight: number | null;
  isFeatured: boolean;
  isOrganic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  productCount: number;
}

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    inStockProducts: 0,
    outOfStockProducts: 0,
    featuredProducts: 0,
    organicProducts: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check admin access
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (user && user.role !== 'ADMIN') {
      navigate('/');
      return;
    }
  }, [token, user, navigate]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const [productsResponse, categoriesResponse] = await Promise.all([
          api.get('/products'),
          api.get('/categories')
        ]);

        if (productsResponse.data.success) {
          const productData = productsResponse.data.data;
          setProducts(productData);
          
          // Calculate stats
          setStats({
            totalProducts: productData.length,
            totalCategories: categoriesResponse.data.success ? categoriesResponse.data.data.length : 0,
            inStockProducts: productData.filter((p: Product) => p.isAvailable).length,
            outOfStockProducts: productData.filter((p: Product) => !p.isAvailable).length,
            featuredProducts: productData.filter((p: Product) => p.isFeatured).length,
            organicProducts: productData.filter((p: Product) => p.isOrganic).length
          });
        }

        if (categoriesResponse.data.success) {
          setCategories(categoriesResponse.data.data);
        }

        setError('');
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'ADMIN') {
      fetchDashboardData();
    }
  }, [user]);

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await api.delete(`/products/${productId}`);
      setProducts(products.filter(p => p.id !== productId));
      setStats(prev => ({
        ...prev,
        totalProducts: prev.totalProducts - 1
      }));
    } catch (error: any) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="admin-container">
        <div className="admin-error">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <p className="admin-subtitle">Manage your products and inventory</p>
      </div>

      {error && (
        <div className="admin-error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon stat-icon-products">📦</div>
          <div className="stat-content">
            <h3>Total Products</h3>
            <p className="stat-number">{stats.totalProducts}</p>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="stat-icon stat-icon-categories">🏷️</div>
          <div className="stat-content">
            <h3>Categories</h3>
            <p className="stat-number">{stats.totalCategories}</p>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="stat-icon stat-icon-stock">✅</div>
          <div className="stat-content">
            <h3>In Stock</h3>
            <p className="stat-number">{stats.inStockProducts}</p>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="stat-icon stat-icon-outstock">❌</div>
          <div className="stat-content">
            <h3>Out of Stock</h3>
            <p className="stat-number">{stats.outOfStockProducts}</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon stat-icon-featured">⭐</div>
          <div className="stat-content">
            <h3>Featured</h3>
            <p className="stat-number">{stats.featuredProducts}</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon stat-icon-organic">🌱</div>
          <div className="stat-content">
            <h3>Organic</h3>
            <p className="stat-number">{stats.organicProducts}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-actions">
        <h2>Quick Actions</h2>
        <div className="admin-action-buttons">
          <button 
            className="admin-action-btn primary"
            onClick={() => navigate('/admin/products/new')}
          >
            ➕ Add New Product
          </button>
          <button 
            className="admin-action-btn secondary"
            onClick={() => navigate('/admin/products')}
          >
            📋 Manage Products
          </button>
          <button 
            className="admin-action-btn secondary"
            onClick={() => navigate('/admin/categories')}
          >
            🏷️ Manage Categories
          </button>
        </div>
      </div>

      {/* Recent Products */}
      <div className="admin-recent-products">
        <h2>Recent Products</h2>
        <div className="admin-products-table-container">
          <table className="admin-products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 10).map((product) => (
                <tr key={product.id}>
                  <td>
                    <img 
                      src={product.thumbnail} 
                      alt={product.name}
                      className="admin-product-thumb"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-product.png';
                      }}
                    />
                  </td>
                  <td>
                    <div className="admin-product-name">
                      {product.name}
                      <div className="admin-product-badges">
                        {product.isFeatured && <span className="admin-badge featured">Featured</span>}
                        {product.isOrganic && <span className="admin-badge organic">Organic</span>}
                      </div>
                    </div>
                  </td>
                  <td>{product.category.name}</td>
                  <td>
                    <div className="admin-product-price">
                      {product.salePrice ? (
                        <>
                          <span className="sale-price">₹{product.salePrice}</span>
                          <span className="original-price">₹{product.price}</span>
                        </>
                      ) : (
                        <span>₹{product.price}</span>
                      )}
                    </div>
                  </td>
                  <td>{product.stock}</td>
                  <td>
                    <span className={`admin-status ${product.isAvailable ? 'available' : 'unavailable'}`}>
                      {product.isAvailable ? 'Available' : 'Out of Stock'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions-cell">
                      <button 
                        className="admin-btn-small edit"
                        onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                      >
                        ✏️
                      </button>
                      <button 
                        className="admin-btn-small delete"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {products.length > 10 && (
          <div className="admin-view-all">
            <button 
              className="admin-action-btn secondary"
              onClick={() => navigate('/admin/products')}
            >
              View All Products ({products.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 
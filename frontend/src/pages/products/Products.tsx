import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './../../styles/products/Products.css';

// TypeScript interfaces matching backend API response
interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  price: number;
  salePrice: number | null;
  categoryId: number;
  category: Category;
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
  createdBy?: User;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  productsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Product[];
  pagination: PaginationData;
}

const Products = () => {
  // React Router navigation
  const navigate = useNavigate();
  
  // Component state management
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Fetch products from backend API with pagination
  const fetchProducts = async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError('');
      
      // Call GET /api/products endpoint with pagination
      const response = await api.get<ApiResponse>(`/products?page=${page}&limit=6`);
      
      // Handle successful response
      if (response.data.success) {
        if (append) {
          // Append new products to existing list (Load More)
          setProducts(prevProducts => [...prevProducts, ...response.data.data]);
        } else {
          // Replace products list (Initial load)
          setProducts(response.data.data);
        }
        setPagination(response.data.pagination);
      } else {
        setError('Failed to load products');
      }
      
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProducts(1, false);
  }, []);

  // Handle product card click - navigate to detail page
  const handleProductClick = (productId: number) => {
    navigate(`/products/${productId}`);
  };

  // Handle Load More button click
  const handleLoadMore = () => {
    if (pagination && pagination.hasNextPage) {
      fetchProducts(pagination.nextPage!, true);
    }
  };

  // Display price with sale price logic
  const displayPrice = (product: Product) => {
    if (product.salePrice) {
      return (
        <div className="product-price-container">
          <span className="product-sale-price">₹{product.salePrice.toFixed(2)}</span>
          <span className="product-original-price">₹{product.price.toFixed(2)}</span>
        </div>
      );
    }
    return <span className="product-price">₹{product.price.toFixed(2)}</span>;
  };

  // Component render logic
  return (
    <div className="products-container">
      <div className="products-header">
        <h1>All Products</h1>
        <p>Fresh products from our collection</p>
        {pagination && (
          <p className="products-summary">
            Showing {products.length} of {pagination.totalProducts} products
          </p>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="products-loading">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="products-error">
          <h2>Error Loading Products</h2>
          <p>{error}</p>
          <button onClick={() => fetchProducts(1, false)}>Try Again</button>
        </div>
      )}

      {/* Success State - Display Products */}
      {!loading && !error && (
        <div className="products-content">
          <div className="products-grid">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="product-card"
                onClick={() => handleProductClick(product.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Product Image */}
                <div className="product-image-container">
                  <img 
                    src={product.thumbnail} 
                    alt={product.name}
                    className="product-image"
                  />
                  
                  {/* Product Badges */}
                  <div className="product-badges">
                    {product.isFeatured && (
                      <span className="badge featured">Featured</span>
                    )}
                    {product.isOrganic && (
                      <span className="badge organic">Organic</span>
                    )}
                    {product.salePrice && (
                      <span className="badge sale">Sale</span>
                    )}
                  </div>
                </div>

                {/* Product Details */}
                <div className="product-details">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-category">{product.category.name}</p>
                  
                  {/* Price Display */}
                  {displayPrice(product)}
                  
                  {/* Stock Status */}
                  <div className="product-stock">
                    {product.stock > 0 ? (
                      <span className="in-stock">In Stock ({product.stock} {product.unit})</span>
                    ) : (
                      <span className="out-of-stock">Out of Stock</span>
                    )}
                  </div>

                  {/* Product SKU */}
                  <p className="product-sku">SKU: {product.sku}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {pagination && pagination.hasNextPage && (
            <div className="load-more-container">
              <button 
                className="load-more-button"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <div className="button-spinner"></div>
                    Loading...
                  </>
                ) : (
                  `Load More Products (${pagination.totalProducts - products.length} remaining)`
                )}
              </button>
            </div>
          )}

          {/* End Message */}
          {pagination && !pagination.hasNextPage && products.length > 6 && (
            <div className="end-message">
              <p>🎉 You've seen all {pagination.totalProducts} products!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Products;


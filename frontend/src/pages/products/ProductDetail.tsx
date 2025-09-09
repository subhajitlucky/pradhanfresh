import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useCart } from '../../context/CartContext';
import './../../styles/products/ProductDetail.css';

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

interface ApiResponse {
  success: boolean;
  message: string;
  data: Product;
}

const ProductDetail = () => {
  // URL parameter extraction
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Cart context
  const { addToCart, loading: cartLoading, isInCart, getCartItem } = useCart();
  
  // Component state management
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // Fetch single product from backend API
  useEffect(() => {
    const fetchProduct = async () => {
      // Validate product ID from URL
      if (!id || isNaN(parseInt(id))) {
        setError('Invalid product ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        // Call GET /api/products/:id endpoint
        const response = await api.get<ApiResponse>(`/products/${id}`);
        
        // Handle successful response
        if (response.data.success) {
          setProduct(response.data.data);
          setSelectedImage(response.data.data.thumbnail); // Set initial image
          console.log(`✅ Loaded product: ${response.data.data.name}`);
        } else {
          setError('Product not found');
        }
        
      } catch (error: any) {
        console.error('❌ Error fetching product:', error);
        if (error.response?.status === 404) {
          setError('Product not found');
        } else {
          setError(error.response?.data?.message || 'Failed to load product');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]); // Re-fetch when ID changes

  // Price display logic with sale price handling
  const displayPrice = () => {
    if (!product) return null;
    
    if (product.salePrice) {
      return (
        <div className="product-price-section">
          <span className="current-price sale">₹{product.salePrice.toFixed(2)}</span>
          <span className="original-price">₹{product.price.toFixed(2)}</span>
          <span className="discount-percentage">
            {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
          </span>
        </div>
      );
    }
    return (
      <div className="product-price-section">
        <span className="current-price">₹{product.price.toFixed(2)}</span>
      </div>
    );
  };

  // Navigation handlers
  const goBack = () => {
    navigate('/products');
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    try {
      const success = await addToCart(product.id, quantity);
      if (success) {
        // Show success feedback or navigate to cart
        alert(`Added ${quantity} ${product.name} to cart!`);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && (!product || newQuantity <= product.stock)) {
      setQuantity(newQuantity);
    }
  };

  // Check if product is already in cart
  const cartItem = product ? getCartItem(product.id) : null;
  const isProductInCart = product ? isInCart(product.id) : false;

  // Component render logic
  return (
    <div className="product-detail-container">
      {/* Back Navigation */}
      <div className="product-detail-header">
        <button onClick={goBack} className="back-button">
          ← Back to Products
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="product-detail-loading">
          <div className="loading-spinner"></div>
          <p>Loading product details...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="product-detail-error">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={goBack} className="error-back-button">
            Go Back to Products
          </button>
        </div>
      )}

      {/* Success State - Display Product Details */}
      {!loading && !error && product && (
        <div className="product-detail-content">
          {/* Product Images Section */}
          <div className="product-images-section">
            {/* Main Product Image */}
            <div className="main-image-container">
              <img 
                src={selectedImage} 
                alt={product.name}
                className="main-product-image"
              />
              
              {/* Product Badges on Image */}
              <div className="product-badges-overlay">
                {product.isFeatured && (
                  <span className="badge featured">Featured</span>
                )}
                {product.isOrganic && (
                  <span className="badge organic">Organic</span>
                )}
                {product.salePrice && (
                  <span className="badge sale">On Sale</span>
                )}
              </div>
            </div>

            {/* Image Gallery Thumbnails */}
            {product.images.length > 1 && (
              <div className="image-gallery">
                {product.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className={`gallery-thumbnail ${selectedImage === image ? 'active' : ''}`}
                    onClick={() => setSelectedImage(image)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Information Section */}
          <div className="product-info-section">
            {/* Product Header */}
            <div className="product-header">
              <h1 className="product-title">{product.name}</h1>
              <p className="product-category">Category: {product.category.name}</p>
              <p className="product-sku">SKU: {product.sku}</p>
            </div>

            {/* Price Section */}
            {displayPrice()}

            {/* Product Description */}
            <div className="product-description">
              <h3>Description</h3>
              {product.shortDescription && (
                <p className="short-description">{product.shortDescription}</p>
              )}
              <p className="full-description">{product.description}</p>
            </div>

            {/* Product Specifications */}
            <div className="product-specifications">
              <h3>Specifications</h3>
              <div className="spec-grid">
                <div className="spec-item">
                  <span className="spec-label">Unit:</span>
                  <span className="spec-value">{product.unit}</span>
                </div>
                {product.weight && (
                  <div className="spec-item">
                    <span className="spec-label">Weight:</span>
                    <span className="spec-value">{product.weight}g</span>
                  </div>
                )}
                <div className="spec-item">
                  <span className="spec-label">Stock:</span>
                  <span className={`spec-value ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                    {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                  </span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Availability:</span>
                  <span className={`spec-value ${product.isAvailable ? 'available' : 'unavailable'}`}>
                    {product.isAvailable ? 'Available' : 'Not Available'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            {product.isAvailable && product.stock > 0 && (
              <div className="quantity-section">
                <h3>Quantity</h3>
                <div className="quantity-controls">
                  <button 
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="quantity-btn decrease"
                  >
                    -
                  </button>
                  <span className="quantity-display">{quantity}</span>
                  <button 
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= product.stock}
                    className="quantity-btn increase"
                  >
                    +
                  </button>
                </div>
                <span className="quantity-note">
                  {product.stock} available
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="product-actions">
              {product.isAvailable && product.stock > 0 ? (
                <>
                  <button 
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="add-to-cart-button"
                  >
                    {addingToCart ? (
                      <>
                        <span className="loading-spinner small"></span>
                        Adding...
                      </>
                    ) : isProductInCart ? (
                      `Update Cart (${cartItem?.quantity} in cart)`
                    ) : (
                      'Add to Cart'
                    )}
                  </button>
                  <button 
                    onClick={() => navigate('/cart')}
                    className="view-cart-button"
                  >
                    View Cart
                  </button>
                </>
              ) : (
                <button className="add-to-cart-button disabled" disabled>
                  {product.stock === 0 ? 'Out of Stock' : 'Not Available'}
                </button>
              )}
            </div>

            {/* Product Meta Information */}
            <div className="product-meta">
              <p className="created-date">
                Added: {new Date(product.createdAt).toLocaleDateString()}
              </p>
              {product.createdBy && (
                <p className="created-by">
                  Listed by: {product.createdBy.name}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail; 
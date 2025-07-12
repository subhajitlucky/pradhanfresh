import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import SearchBar from '../../components/SearchBar';
import FilterSidebar from '../../components/FilterSidebar';
import SortDropdown from '../../components/SortDropdown';
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

interface FilterMetadata {
  totalResults: number;
  appliedFilters: {
    search: string | null;
    categories: number[] | null;
    priceRange: { min: number | null; max: number | null } | null;
    isOrganic: boolean | null;
    isFeatured: boolean | null;
    sortBy: string;
    sortOrder: string;
  };
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Product[];
  pagination: PaginationData;
  filters: FilterMetadata;
}

interface FilterState {
  categories: number[];
  priceRange: {
    min: number | null;
    max: number | null;
  };
  isOrganic: boolean | null;
  isFeatured: boolean | null;
}

const Products = () => {
  // URL search params for deep linking
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Component state management
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [filterMetadata, setFilterMetadata] = useState<FilterMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState<FilterState>({
    categories: searchParams.get('categories')?.split(',').map(Number).filter(Boolean) || [],
    priceRange: {
      min: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null,
      max: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null,
    },
    isOrganic: searchParams.get('isOrganic') === 'true' ? true : searchParams.get('isOrganic') === 'false' ? false : null,
    isFeatured: searchParams.get('isFeatured') === 'true' ? true : null,
  });
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');

  // Build query parameters for API call
  const buildQueryParams = useCallback((page: number = 1) => {
    const params = new URLSearchParams();
    
    params.append('page', page.toString());
    params.append('limit', '6');
    
    if (searchTerm.trim()) {
      params.append('search', searchTerm.trim());
    }
    
    if (filters.categories.length > 0) {
      params.append('categories', filters.categories.join(','));
    }
    
    if (filters.priceRange.min !== null) {
      params.append('minPrice', filters.priceRange.min.toString());
    }
    
    if (filters.priceRange.max !== null) {
      params.append('maxPrice', filters.priceRange.max.toString());
    }
    
    if (filters.isOrganic !== null) {
      params.append('isOrganic', filters.isOrganic.toString());
    }
    
    if (filters.isFeatured !== null) {
      params.append('isFeatured', filters.isFeatured.toString());
    }
    
    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);
    
    return params;
  }, [searchTerm, filters, sortBy, sortOrder]);

  // Update URL when filters change
  const updateURL = useCallback(() => {
    const params = buildQueryParams(1);
    setSearchParams(params);
  }, [buildQueryParams, setSearchParams]);

  // Fetch products from backend API with search, filters, and pagination
  const fetchProducts = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError('');
      
      const queryParams = buildQueryParams(page);
      const response = await api.get<ApiResponse>(`/products?${queryParams.toString()}`);
      
      if (response.data.success) {
        if (append) {
          setProducts(prevProducts => [...prevProducts, ...response.data.data]);
        } else {
          setProducts(response.data.data);
        }
        setPagination(response.data.pagination);
        setFilterMetadata(response.data.filters);
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
  }, [buildQueryParams]);

  // Update URL and fetch products when filters change
  useEffect(() => {
    updateURL();
    fetchProducts(1, false);
  }, [searchTerm, filters, sortBy, sortOrder, updateURL, fetchProducts]);

  // Event handlers
  const handleSearch = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSortBy: string, newSortOrder: string) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handleProductClick = (productId: number) => {
    navigate(`/products/${productId}`);
  };

  const handleLoadMore = () => {
    if (pagination && pagination.hasNextPage) {
      fetchProducts(pagination.nextPage!, true);
    }
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      categories: [],
      priceRange: { min: null, max: null },
      isOrganic: null,
      isFeatured: null,
    });
    setSortBy('createdAt');
    setSortOrder('desc');
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

  // Check if any filters are active
  const hasActiveFilters = searchTerm.trim() || 
                          filters.categories.length > 0 || 
                          filters.priceRange.min !== null || 
                          filters.priceRange.max !== null ||
                          filters.isOrganic !== null ||
                          filters.isFeatured !== null ||
                          sortBy !== 'createdAt' ||
                          sortOrder !== 'desc';

  return (
    <div className="products-page">
      {/* Header with Search */}
      <div className="products-header">
        <div className="header-content">
          <h1>All Products</h1>
          <p>Fresh products from our collection</p>
        </div>
        
        <div className="search-section">
          <SearchBar 
            onSearch={handleSearch}
            initialValue={searchTerm}
            placeholder="Search products, categories..."
          />
        </div>
        
        {/* Results Summary */}
        <div className="results-summary">
          {filterMetadata && (
            <div className="results-info">
              <span className="results-count">
                {filterMetadata.totalResults} product{filterMetadata.totalResults !== 1 ? 's' : ''} found
              </span>
              {hasActiveFilters && (
                <button 
                  onClick={handleClearAllFilters}
                  className="clear-all-btn"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
          
          <div className="sort-section">
            <SortDropdown 
              onSortChange={handleSortChange}
              currentSort={{ sortBy, sortOrder }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="products-main">
        {/* Filter Sidebar */}
        <aside className="filters-aside">
          <FilterSidebar 
            onFilterChange={handleFilterChange}
            initialFilters={filters}
            isLoading={loading}
          />
        </aside>

        {/* Products Content */}
        <main className="products-content">
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

          {/* No Results State */}
          {!loading && !error && products.length === 0 && (
            <div className="no-products">
              <div className="no-products-icon">🔍</div>
              <h2>No products found</h2>
              <p>Try adjusting your search or filters to find what you're looking for.</p>
              {hasActiveFilters && (
                <button onClick={handleClearAllFilters} className="clear-filters-cta">
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && products.length > 0 && (
            <>
              <div className="products-grid">
                {products.map((product) => (
                  <div 
                    key={product.id} 
                    className="product-card"
                    onClick={() => handleProductClick(product.id)}
                  >
                    {/* Product Image */}
                    <div className="product-image-container">
                      <img 
                        src={product.thumbnail} 
                        alt={product.name}
                        className="product-image"
                        loading="lazy"
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

                    {/* Product Info */}
                    <div className="product-info">
                      <div className="product-category">
                        {product.category.name}
                      </div>
                      
                      <h3 className="product-name">{product.name}</h3>
                      
                      {product.shortDescription && (
                        <p className="product-description">
                          {product.shortDescription}
                        </p>
                      )}
                      
                      <div className="product-details">
                        <div className="product-pricing">
                          {displayPrice(product)}
                          <span className="product-unit">per {product.unit}</span>
                        </div>
                        
                        <div className="product-stock">
                          {product.stock > 0 ? (
                            <span className="in-stock">In Stock ({product.stock})</span>
                          ) : (
                            <span className="out-of-stock">Out of Stock</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {pagination && pagination.hasNextPage && (
                <div className="load-more-section">
                  <button 
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="load-more-btn"
                  >
                    {loadingMore ? (
                      <>
                        <div className="loading-spinner small"></div>
                        Loading more...
                      </>
                    ) : (
                      `Load More (${pagination.totalProducts - products.length} remaining)`
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;


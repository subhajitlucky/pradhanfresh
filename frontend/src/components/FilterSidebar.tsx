import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/components/FilterSidebar.css';

interface Category {
  id: number;
  name: string;
  slug: string;
  productCount: number;
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

interface FilterSidebarProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
  isLoading?: boolean;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ 
  onFilterChange, 
  initialFilters = {},
  isLoading = false 
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    categories: initialFilters.categories || [],
    priceRange: initialFilters.priceRange || { min: null, max: null },
    isOrganic: initialFilters.isOrganic || null,
    isFeatured: initialFilters.isFeatured || null
  });

  const [priceInputs, setPriceInputs] = useState({
    min: initialFilters.priceRange?.min?.toString() || '',
    max: initialFilters.priceRange?.max?.toString() || ''
  });

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await api.get('/categories');
        
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Update filters when they change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      categories: checked 
        ? [...prev.categories, categoryId]
        : prev.categories.filter(id => id !== categoryId)
    }));
  };

  const handlePriceInputChange = (type: 'min' | 'max', value: string) => {
    setPriceInputs(prev => ({
      ...prev,
      [type]: value
    }));

    // Parse and update filters
    const numericValue = value === '' ? null : parseFloat(value);
    
    if (value === '' || (!isNaN(numericValue!) && numericValue! >= 0)) {
      setFilters(prev => ({
        ...prev,
        priceRange: {
          ...prev.priceRange,
          [type]: numericValue
        }
      }));
    }
  };

  const handleFeatureFilter = (feature: 'isOrganic' | 'isFeatured', value: boolean | null) => {
    setFilters(prev => ({
      ...prev,
      [feature]: value
    }));
  };

  const clearAllFilters = () => {
    const emptyFilters = {
      categories: [],
      priceRange: { min: null, max: null },
      isOrganic: null,
      isFeatured: null
    };
    
    setFilters(emptyFilters);
    setPriceInputs({ min: '', max: '' });
  };

  const hasActiveFilters = filters.categories.length > 0 || 
                          filters.priceRange.min !== null || 
                          filters.priceRange.max !== null ||
                          filters.isOrganic !== null ||
                          filters.isFeatured !== null;

  return (
    <div className={`filter-sidebar ${isLoading ? 'loading' : ''}`}>
      <div className="filter-header">
        <h3>Filter Products</h3>
        {hasActiveFilters && (
          <button 
            onClick={clearAllFilters}
            className="clear-filters-btn"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Categories Filter */}
      <div className="filter-section">
        <h4>Categories</h4>
        {categoriesLoading ? (
          <div className="filter-loading">
            <div className="loading-spinner small"></div>
            <span>Loading categories...</span>
          </div>
        ) : (
          <div className="filter-options">
            {categories.map(category => (
              <label key={category.id} className="filter-option">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category.id)}
                  onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                />
                <span className="checkmark"></span>
                <span className="option-label">
                  {category.name}
                  <span className="product-count">({category.productCount})</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range Filter */}
      <div className="filter-section">
        <h4>Price Range</h4>
        <div className="price-range-inputs">
          <div className="price-input-group">
            <label>Min Price</label>
            <div className="price-input-container">
              <span className="currency">₹</span>
              <input
                type="number"
                placeholder="0"
                value={priceInputs.min}
                onChange={(e) => handlePriceInputChange('min', e.target.value)}
                min="0"
                step="0.01"
                className="price-input"
              />
            </div>
          </div>
          <div className="price-input-group">
            <label>Max Price</label>
            <div className="price-input-container">
              <span className="currency">₹</span>
              <input
                type="number"
                placeholder="1000"
                value={priceInputs.max}
                onChange={(e) => handlePriceInputChange('max', e.target.value)}
                min="0"
                step="0.01"
                className="price-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feature Filters */}
      <div className="filter-section">
        <h4>Features</h4>
        <div className="filter-options">
          {/* Organic Filter */}
          <div className="feature-filter">
            <label>Organic Products</label>
            <div className="feature-buttons">
              <button
                className={`filter-btn ${filters.isOrganic === true ? 'active' : ''}`}
                onClick={() => handleFeatureFilter('isOrganic', filters.isOrganic === true ? null : true)}
              >
                Organic Only
              </button>
              <button
                className={`filter-btn ${filters.isOrganic === false ? 'active' : ''}`}
                onClick={() => handleFeatureFilter('isOrganic', filters.isOrganic === false ? null : false)}
              >
                Non-Organic
              </button>
            </div>
          </div>

          {/* Featured Filter */}
          <div className="feature-filter">
            <label>Featured Products</label>
            <div className="feature-buttons">
              <button
                className={`filter-btn ${filters.isFeatured === true ? 'active' : ''}`}
                onClick={() => handleFeatureFilter('isFeatured', filters.isFeatured === true ? null : true)}
              >
                Featured Only
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="active-filters">
          <h4>Active Filters</h4>
          <div className="filter-tags">
            {filters.categories.map(categoryId => {
              const category = categories.find(c => c.id === categoryId);
              return category ? (
                <span key={categoryId} className="filter-tag">
                  {category.name}
                  <button onClick={() => handleCategoryChange(categoryId, false)}>×</button>
                </span>
              ) : null;
            })}
            
            {(filters.priceRange.min !== null || filters.priceRange.max !== null) && (
              <span className="filter-tag">
                ₹{filters.priceRange.min || 0} - ₹{filters.priceRange.max || '∞'}
                <button onClick={() => setFilters(prev => ({ ...prev, priceRange: { min: null, max: null } }))}>×</button>
              </span>
            )}
            
            {filters.isOrganic !== null && (
              <span className="filter-tag">
                {filters.isOrganic ? 'Organic' : 'Non-Organic'}
                <button onClick={() => handleFeatureFilter('isOrganic', null)}>×</button>
              </span>
            )}
            
            {filters.isFeatured !== null && (
              <span className="filter-tag">
                Featured
                <button onClick={() => handleFeatureFilter('isFeatured', null)}>×</button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSidebar; 
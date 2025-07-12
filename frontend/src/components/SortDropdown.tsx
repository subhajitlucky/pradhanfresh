import React, { useState } from 'react';
import '../styles/components/SortDropdown.css';

interface SortOption {
  value: string;
  label: string;
  sortBy: string;
  sortOrder: string;
}

interface SortDropdownProps {
  onSortChange: (sortBy: string, sortOrder: string) => void;
  currentSort?: {
    sortBy: string;
    sortOrder: string;
  };
}

const SortDropdown: React.FC<SortDropdownProps> = ({ 
  onSortChange, 
  currentSort = { sortBy: 'createdAt', sortOrder: 'desc' }
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions: SortOption[] = [
    { value: 'newest', label: 'Newest First', sortBy: 'createdAt', sortOrder: 'desc' },
    { value: 'oldest', label: 'Oldest First', sortBy: 'createdAt', sortOrder: 'asc' },
    { value: 'name-asc', label: 'Name: A to Z', sortBy: 'name', sortOrder: 'asc' },
    { value: 'name-desc', label: 'Name: Z to A', sortBy: 'name', sortOrder: 'desc' },
    { value: 'price-low', label: 'Price: Low to High', sortBy: 'price', sortOrder: 'asc' },
    { value: 'price-high', label: 'Price: High to Low', sortBy: 'price', sortOrder: 'desc' },
  ];

  const getCurrentSortLabel = () => {
    const currentOption = sortOptions.find(
      option => option.sortBy === currentSort.sortBy && option.sortOrder === currentSort.sortOrder
    );
    return currentOption?.label || 'Sort by';
  };

  const handleSortSelect = (option: SortOption) => {
    onSortChange(option.sortBy, option.sortOrder);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.sort-dropdown')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="sort-dropdown">
      <div className="sort-label">Sort by:</div>
      <div className={`dropdown-container ${isOpen ? 'open' : ''}`}>
        <button
          className="dropdown-trigger"
          onClick={toggleDropdown}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="current-sort">{getCurrentSortLabel()}</span>
          <svg 
            className={`dropdown-arrow ${isOpen ? 'rotated' : ''}`}
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
          >
            <polyline points="6,9 12,15 18,9"></polyline>
          </svg>
        </button>

        {isOpen && (
          <div className="dropdown-menu" role="listbox">
            {sortOptions.map((option) => {
              const isSelected = option.sortBy === currentSort.sortBy && 
                               option.sortOrder === currentSort.sortOrder;
              
              return (
                <button
                  key={option.value}
                  className={`dropdown-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSortSelect(option)}
                  role="option"
                  aria-selected={isSelected}
                >
                  {option.label}
                  {isSelected && (
                    <svg 
                      className="check-icon" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor"
                    >
                      <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SortDropdown; 
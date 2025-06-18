import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/products.css';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  availability: boolean;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get<Product[]>('http://localhost:3001/products');
        setProducts(response.data);
        setFilteredProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    let result = [...products];
    if (category !== 'all') {
      result = result.filter(product => product.category === category);
    }
    result.sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      return a.name.localeCompare(b.name);
    });
    setFilteredProducts(result);
  }, [category, sortBy, products]);

  


  return (
    <div className="products-container">
      <div className="products-main-content">
        <h1 className="products-title">Our Products</h1>
        <div className="products-filters">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="products-filter-select"
          >
            <option value="all">All Categories</option>
            <option value="fruits">Fruits</option>
            <option value="vegetables">Vegetables</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="products-filter-select"
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
          </select>
        </div>
        <div className="products-grid">
          {(showAll ? filteredProducts : filteredProducts.slice(0, 8)).map((product) => (
            <div key={product.id} className="product-card">
              <img src={product.image} alt={product.name} className="product-image" />
              <div className="product-content">
                <h2 className="product-name">{product.name}</h2>
                <p className="product-price">${product.price.toFixed(2)}</p>
                <p className="product-description">{product.description}</p>
                <p className={`product-availability ${product.availability ? 'product-in-stock' : 'product-out-of-stock'}`}>
                  {product.availability ? 'In Stock' : 'Out of Stock'}
                </p>
              </div>
            </div>
          ))}
        </div>
        {!showAll && filteredProducts.length > 8 && (
          <div className="products-show-more">
            <button
              onClick={() => setShowAll(true)}
              className="products-show-more-button"
            >
              Show More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;


import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
    <div className="bg-primary-50 py-20">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-primary-800">Our Products</h1>
        <div className="mb-8 flex justify-center space-x-4">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-2 border rounded bg-white text-primary-700"
          >
            <option value="all">All Categories</option>
            <option value="fruits">Fruits</option>
            <option value="vegetables">Vegetables</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-2 border rounded bg-white text-primary-700"
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {(showAll ? filteredProducts : filteredProducts.slice(0, 8)).map((product) => (
            <div key={product.id} className="bg-white shadow-lg rounded-lg overflow-hidden transform transition duration-300 hover:scale-105">
              <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2 text-primary-700">{product.name}</h2>
                <p className="text-primary-600 mb-2">${product.price.toFixed(2)}</p>
                <p className="text-sm text-primary-500 mb-2">{product.description}</p>
                <p className={`text-sm ${product.availability ? 'text-green-600' : 'text-red-600'}`}>
                  {product.availability ? 'In Stock' : 'Out of Stock'}
                </p>
              </div>
            </div>
          ))}
        </div>
        {!showAll && filteredProducts.length > 8 && (
          <div className="text-center mt-8">
            <button
              onClick={() => setShowAll(true)}
              className="bg-secondary-500 text-white px-6 py-2 rounded-full hover:bg-secondary-600 transition-colors"
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


import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ProductFormData {
  name: string;
  description: string;
  shortDescription: string;
  price: string;
  salePrice: string;
  categoryId: string;
  images: string[];
  thumbnail: string;
  stock: string;
  sku: string;
  unit: string;
  weight: string;
  isFeatured: boolean;
  isOrganic: boolean;
}

const AdminProductForm = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    salePrice: '',
    categoryId: '',
    images: [],
    thumbnail: '',
    stock: '0',
    sku: '',
    unit: 'kg',
    weight: '',
    isFeatured: false,
    isOrganic: false
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageInput, setImageInput] = useState('');

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

  // Fetch categories and product data (if editing)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const categoriesResponse = await api.get('/categories');
        if (categoriesResponse.data.success) {
          setCategories(categoriesResponse.data.data);
        }

        // If editing, fetch product data
        if (isEditing && id) {
          const productResponse = await api.get(`/products/${id}`);
          if (productResponse.data.success) {
            const product = productResponse.data.data;
            setFormData({
              name: product.name,
              description: product.description,
              shortDescription: product.shortDescription || '',
              price: product.price.toString(),
              salePrice: product.salePrice?.toString() || '',
              categoryId: product.categoryId.toString(),
              images: product.images || [],
              thumbnail: product.thumbnail,
              stock: product.stock.toString(),
              sku: product.sku,
              unit: product.unit,
              weight: product.weight?.toString() || '',
              isFeatured: product.isFeatured,
              isOrganic: product.isOrganic
            });
          }
        }
      } catch (error: unknown) {
        setError('Failed to load data');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'ADMIN') {
      fetchData();
    }
  }, [user, isEditing, id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddImage = () => {
    if (imageInput.trim() && !formData.images.includes(imageInput.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageInput.trim()]
      }));
      setImageInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSetThumbnail = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      thumbnail: imageUrl
    }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.name.trim()) errors.push('Product name is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (!formData.price || parseFloat(formData.price) <= 0) errors.push('Valid price is required');
    if (!formData.categoryId) errors.push('Category is required');
    if (!formData.thumbnail.trim()) errors.push('Thumbnail image is required');
    if (!formData.sku.trim()) errors.push('SKU is required');
    if (!formData.unit.trim()) errors.push('Unit is required');
    if (formData.salePrice && parseFloat(formData.salePrice) >= parseFloat(formData.price)) {
      errors.push('Sale price must be less than regular price');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        shortDescription: formData.shortDescription.trim() || null,
        price: parseFloat(formData.price),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
        categoryId: parseInt(formData.categoryId),
        images: formData.images.length > 0 ? formData.images : [formData.thumbnail],
        thumbnail: formData.thumbnail.trim(),
        stock: parseInt(formData.stock),
        sku: formData.sku.trim(),
        unit: formData.unit.trim(),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        isFeatured: formData.isFeatured,
        isOrganic: formData.isOrganic
      };

      let response;
      if (isEditing) {
        response = await api.put(`/products/${id}`, submitData);
      } else {
        response = await api.post('/products', submitData);
      }

      if (response.data.success) {
        setSuccess(`Product ${isEditing ? 'updated' : 'created'} successfully!`);
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1500);
      } else {
        setError(response.data.message || 'Failed to save product');
      }
    } catch (error: unknown) {
      console.error('Error saving product:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError(`Failed to ${isEditing ? 'update' : 'create'} product`);
      }
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="admin-title">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h1>
        <button 
          className="admin-back-btn"
          onClick={() => navigate('/admin/dashboard')}
        >
          ← Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="admin-error-message">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="admin-success-message">
          <p>{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-product-form">
        <div className="admin-form-grid">
          {/* Basic Information */}
          <div className="admin-form-section">
            <h3>Basic Information</h3>
            
            <div className="admin-form-group">
              <label htmlFor="name">Product Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="admin-form-input"
                placeholder="Enter product name"
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="sku">SKU *</label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                required
                className="admin-form-input"
                placeholder="Enter unique SKU"
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="categoryId">Category *</label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                required
                className="admin-form-select"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                className="admin-form-textarea"
                rows={4}
                placeholder="Enter detailed product description"
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="shortDescription">Short Description</label>
              <textarea
                id="shortDescription"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                className="admin-form-textarea"
                rows={2}
                placeholder="Enter brief product description (optional)"
              />
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="admin-form-section">
            <h3>Pricing & Inventory</h3>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label htmlFor="price">Regular Price (₹) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="admin-form-input"
                  placeholder="0.00"
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="salePrice">Sale Price (₹)</label>
                <input
                  type="number"
                  id="salePrice"
                  name="salePrice"
                  value={formData.salePrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="admin-form-input"
                  placeholder="0.00 (optional)"
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label htmlFor="stock">Stock Quantity *</label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="admin-form-input"
                  placeholder="0"
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="unit">Unit *</label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                  className="admin-form-select"
                >
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="lb">Pound (lb)</option>
                  <option value="piece">Piece</option>
                  <option value="dozen">Dozen</option>
                  <option value="liter">Liter</option>
                  <option value="ml">Milliliter (ml)</option>
                  <option value="pack">Pack</option>
                  <option value="bunch">Bunch</option>
                </select>
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="weight">Weight (kg)</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="admin-form-input"
                placeholder="Weight in kg (optional)"
              />
            </div>
          </div>

          {/* Images */}
          <div className="admin-form-section full-width">
            <h3>Product Images</h3>
            
            <div className="admin-form-group">
              <label htmlFor="thumbnail">Thumbnail Image URL *</label>
              <input
                type="url"
                id="thumbnail"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleInputChange}
                required
                className="admin-form-input"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="admin-form-group">
              <label>Additional Images</label>
              <div className="admin-image-input">
                <input
                  type="url"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  className="admin-form-input"
                  placeholder="https://example.com/image.jpg"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="admin-add-image-btn"
                >
                  Add Image
                </button>
              </div>
            </div>

            {formData.images.length > 0 && (
              <div className="admin-images-list">
                {formData.images.map((image, index) => (
                  <div key={index} className="admin-image-item">
                    <img src={image} alt={`Product ${index + 1}`} />
                    <div className="admin-image-actions">
                      <button
                        type="button"
                        onClick={() => handleSetThumbnail(image)}
                        className="admin-btn-small primary"
                        disabled={image === formData.thumbnail}
                      >
                        {image === formData.thumbnail ? 'Thumbnail' : 'Set as Thumbnail'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="admin-btn-small delete"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Attributes */}
          <div className="admin-form-section full-width">
            <h3>Product Attributes</h3>
            
            <div className="admin-checkbox-group">
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className="admin-checkbox"
                />
                <span className="admin-checkbox-text">Featured Product</span>
                <span className="admin-checkbox-help">This product will be highlighted on the homepage</span>
              </label>

              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  name="isOrganic"
                  checked={formData.isOrganic}
                  onChange={handleInputChange}
                  className="admin-checkbox"
                />
                <span className="admin-checkbox-text">Organic Product</span>
                <span className="admin-checkbox-help">This product is certified organic</span>
              </label>
            </div>
          </div>
        </div>

        <div className="admin-form-actions">
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="admin-action-btn secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="admin-action-btn primary"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm; 
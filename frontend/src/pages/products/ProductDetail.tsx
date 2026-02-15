import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ShoppingBag,
  Leaf,
  ShieldCheck,
  Truck,
  Star,
  Minus,
  Plus,
  Share2,
  Heart
} from 'lucide-react';
import api from '../../utils/api';
import { useCart } from '../../context/CartContext';
import { cn } from '../../utils/cn';

// Existing Product Interface
interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  price: number;
  salePrice: number | null;
  categoryId: number;
  category: { name: string };
  images: string[];
  thumbnail: string;
  stock: number;
  isAvailable: boolean;
  unit: string;
  weight: number | null;
  isOrganic: boolean;
  isFeatured: boolean;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/products/${id}`);
        if (response.data.success) {
          setProduct(response.data.data);
          setSelectedImage(response.data.data.thumbnail);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    await addToCart(product.id, quantity);
    setAddingToCart(false);
  };

  if (loading) return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-12">
        <div className="aspect-square bg-gray-100 rounded-[40px] animate-pulse" />
        <div className="space-y-6">
          <div className="h-10 w-3/4 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-6 w-1/4 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-32 w-full bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );

  if (!product) return <div>Product not found</div>;

  return (
    <div className="pt-28 pb-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary-600 transition-colors mb-8 group italic"
        >
          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Products
        </button>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Images Section */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-square rounded-[48px] overflow-hidden bg-gray-50 border border-gray-100 shadow-xl shadow-gray-100 group"
            >
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-6 left-6 flex flex-col gap-3">
                {product.isOrganic && (
                  <div className="bg-emerald-500 text-white px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                    <Leaf size={14} /> Organic
                  </div>
                )}
                {product.salePrice && (
                  <div className="bg-red-500 text-white px-4 py-2 rounded-2xl shadow-lg text-xs font-bold uppercase tracking-widest">
                    Sale
                  </div>
                )}
              </div>
              <button className="absolute top-6 right-6 p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg text-gray-400 hover:text-red-500 transition-colors">
                <Heart size={20} />
              </button>
            </motion.div>

            {/* Gallery */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {[product.thumbnail, ...product.images].map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={cn(
                    "w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all p-1 bg-white shrink-0",
                    selectedImage === img ? "border-primary-600 shadow-lg shadow-primary-50" : "border-gray-100 opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={img} alt="preview" className="w-full h-full object-cover rounded-xl" />
                </button>
              ))}
            </div>
          </div>

          {/* Details Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-10"
          >
            <div>
              <div className="flex items-center gap-2 text-primary-600 font-bold text-sm uppercase tracking-widest mb-4 italic">
                <span>{product.category.name}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="text-gray-400">SKU: {product.sku}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-yellow-400">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={18} fill="currentColor" />)}
                </div>
                <span className="text-sm font-bold text-gray-400">(120 Reviews)</span>
                <span className="h-4 w-px bg-gray-200" />
                <button className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-primary-600 transition-colors">
                  <Share2 size={16} /> Share
                </button>
              </div>
            </div>

            <div className="flex items-baseline gap-4 italic">
              <span className="text-5xl font-black text-gray-900">₹{product.salePrice || product.price}</span>
              {product.salePrice && (
                <span className="text-2xl text-gray-400 line-through font-bold">₹{product.price}</span>
              )}
              <span className="text-lg text-gray-500 font-bold">/ {product.unit}</span>
            </div>

            <p className="text-lg text-gray-600 leading-relaxed italic border-l-4 border-primary-100 pl-6">
              {product.description}
            </p>

            {/* Features Row */}
            <div className="grid grid-cols-3 gap-4 border-y border-gray-100 py-8">
              {[
                { icon: ShieldCheck, label: 'Quality Assured' },
                { icon: Truck, label: 'Home Delivery' },
                { icon: Star, label: 'Premium Sourcing' },
              ].map((f, i) => (
                <div key={i} className="flex flex-col items-center gap-2 text-center">
                  <div className="p-3 bg-gray-50 rounded-2xl text-primary-600">
                    <f.icon size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">{f.label}</span>
                </div>
              ))}
            </div>

            {/* Purchase Options */}
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center bg-gray-100 rounded-2xl p-1 shrink-0">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-white rounded-xl transition-all text-gray-500"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="w-12 text-center font-black text-xl">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-3 hover:bg-white rounded-xl transition-all text-gray-500"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="text-sm font-bold">
                  {product.stock > 0 ? (
                    <span className="text-emerald-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {product.stock} items remaining
                    </span>
                  ) : (
                    <span className="text-red-500 italic">Currently Out of Stock</span>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.stock <= 0}
                  className="grow py-5 bg-primary-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-primary-200 hover:bg-primary-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-3"
                >
                  <ShoppingBag size={24} />
                  {addingToCart ? "Adding..." : "Add to Basket"}
                </button>
                <button className="p-5 border-2 border-gray-100 rounded-3xl text-gray-400 hover:text-primary-600 hover:border-primary-100 transition-colors">
                  <Heart size={24} />
                </button>
              </div>
            </div>

            {/* More Details */}
            <div className="space-y-4 pt-4">
              <div className="flex justify-between text-sm py-3 border-b border-gray-50">
                <span className="text-gray-400 font-bold uppercase tracking-wider italic">Weight</span>
                <span className="text-gray-900 font-bold italic">{product.weight ? `${product.weight}g` : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm py-3 border-b border-gray-50">
                <span className="text-gray-400 font-bold uppercase tracking-wider italic">Grown In</span>
                <span className="text-gray-900 font-bold italic">Local Organic Farms</span>
              </div>
              <div className="flex justify-between text-sm py-3 border-b border-gray-50">
                <span className="text-gray-400 font-bold uppercase tracking-wider italic">Shelf Life</span>
                <span className="text-gray-900 font-bold italic">3-5 Days</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Filter,
  Search,
  ChevronDown,
  Grid2X2,
  List,
  SlidersHorizontal,
  Leaf,
  Star,
  Plus,
  ArrowRight,
  X
} from 'lucide-react';
import api from '../../utils/api';
import { cn } from '../../utils/cn';

// Types (Omitted for brevity, using existing ones from file)
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
  thumbnail: string;
  stock: number;
  isAvailable: boolean;
  unit: string;
  isOrganic: boolean;
  isFeatured: boolean;
}

const Products = () => {
  // Search params can be added later for filter/sort URL state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Basic fetch logic (preserving functionality)
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="pt-24 pb-24 px-4 bg-gray-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Page Title & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Our Collection</h1>
            <p className="text-gray-500 italic">Freshly picked from our local farms, delivered to you.</p>
          </div>

          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for fruits, veggies..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-gray-100 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filters */}
          <aside className="hidden lg:block w-72 shrink-0 space-y-8">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 italic">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-primary-600" />
                  Filters
                </h3>
                <button className="text-xs font-semibold text-primary-600 hover:underline">Reset</button>
              </div>

              {/* Categories */}
              <div className="space-y-4 mb-8">
                <p className="text-sm font-bold text-gray-800">Categories</p>
                {['All Items', 'Fruits', 'Vegetables', 'Organic', 'Daily Bundle'].map((cat) => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded-lg border-gray-200 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm text-gray-600 group-hover:text-primary-600 transition-colors">{cat}</span>
                  </label>
                ))}
              </div>

              {/* Price Range */}
              <div className="space-y-4">
                <p className="text-sm font-bold text-gray-800">Price Range</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 border border-gray-200 rounded-lg">Min ₹0</div>
                  <div className="p-2 border border-gray-200 rounded-lg">Max ₹500</div>
                </div>
              </div>
            </div>

            {/* Promo Card */}
            <div className="bg-primary-600 rounded-[32px] p-6 text-white text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <Leaf className="mx-auto mb-4 opacity-80" size={32} />
              <p className="text-sm font-medium mb-1">Weekly Special</p>
              <h4 className="text-xl font-bold mb-4">20% OFF Organic Greens</h4>
              <button className="w-full py-3 bg-white text-primary-600 font-bold rounded-xl text-sm hover:bg-primary-50 transition-colors">
                Get Offer
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="grow">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 italic">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold"
                >
                  <Filter size={16} /> Filters
                </button>
                <p className="text-sm text-gray-500 font-medium">Showing {products.length} products</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white text-primary-600 shadow-sm" : "text-gray-400")}
                  >
                    <Grid2X2 size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white text-primary-600 shadow-sm" : "text-gray-400")}
                  >
                    <List size={18} />
                  </button>
                </div>
                <div className="h-8 w-px bg-gray-200 mx-2" />
                <button className="flex items-center gap-2 text-sm font-bold text-gray-700 px-3">
                  Sort By <ChevronDown size={16} />
                </button>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white rounded-[32px] h-[450px] animate-pulse border border-gray-100" />
                ))}
              </div>
            ) : (
              <div className={cn(
                "grid gap-6",
                viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
              )}>
                <AnimatePresence>
                  {products.map((product) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={product.id}
                      className={cn(
                        "group bg-white rounded-[32px] border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-primary-100/50 transition-all duration-300",
                        viewMode === 'list' && "flex gap-6 h-64"
                      )}
                    >
                      {/* Image */}
                      <div className={cn(
                        "relative bg-gray-100 overflow-hidden",
                        viewMode === 'grid' ? "h-64" : "w-72 h-full shrink-0"
                      )}>
                        <img
                          src={product.thumbnail}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        {/* Badges */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          {product.isOrganic && (
                            <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                              <Leaf size={12} /> Organic
                            </div>
                          )}
                          {product.salePrice && (
                            <div className="bg-red-500 text-white px-3 py-1 rounded-xl shadow-lg text-[10px] font-bold uppercase tracking-wider">
                              Sale
                            </div>
                          )}
                        </div>
                        {/* Quick Add */}
                        <button className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary-600 hover:text-white">
                          <Plus size={24} />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-6 flex flex-col justify-between grow">
                        <div>
                          <div className="flex justify-between items-start mb-2 group-hover:italic group-hover:text-primary-600 transition-all">
                            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest">{product.category.name}</p>
                            <div className="flex items-center gap-1 text-yellow-500">
                              <Star size={12} fill="currentColor" />
                              <span className="text-[10px] font-bold text-gray-400">4.9</span>
                            </div>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{product.name}</h3>
                          <p className="text-gray-500 text-sm line-clamp-2 md:line-clamp-3 mb-4 leading-relaxed group-hover:italic">
                            {product.shortDescription || product.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 italic">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-gray-900">₹{product.salePrice || product.price}</span>
                            <span className="text-sm text-gray-400 font-bold">/ {product.unit}</span>
                          </div>
                          <Link
                            to={`/products/${product.id}`}
                            className="text-gray-400 hover:text-primary-600 transition-colors"
                          >
                            <ArrowRight size={20} />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Sheet (Abstracted for brevity) */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-[80%] max-w-sm bg-white z-[70] p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Filters</h2>
                <button onClick={() => setIsFilterOpen(false)} className="p-2"><X /></button>
              </div>
              {/* Reuse Desktop Filters logic here */}
              <div className="space-y-6 italic">
                <p className="font-bold">Coming soon...</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;

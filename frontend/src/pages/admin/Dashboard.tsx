import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Leaf,
  Plus,
  Search,
  Edit3,
  Trash2,
  TrendingUp,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { useAuthStore } from '../../context/authStore';
import api from '../../utils/api';
import { cn } from '../../utils/cn';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  category: { name: string };
  thumbnail: string;
  stock: number;
  isAvailable: boolean;
  isFeatured: boolean;
  isOrganic: boolean;
}

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    inStock: 0,
    outStock: 0,
    featured: 0,
    organic: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories')
        ]);
        if (prodRes.data.success) {
          const data = prodRes.data.data;
          setProducts(data);
          setStats({
            totalProducts: data.length,
            totalCategories: catRes.data.success ? catRes.data.data.length : 0,
            inStock: data.filter((p: Product) => p.isAvailable).length,
            outStock: data.filter((p: Product) => !p.isAvailable).length,
            featured: data.filter((p: Product) => p.isFeatured).length,
            organic: data.filter((p: Product) => p.isOrganic).length
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this product?')) {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
    }
  };

  if (loading) return (
    <div className="pt-32 px-4 max-w-7xl mx-auto space-y-8">
      <div className="h-20 bg-gray-50 rounded-[32px] animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-50 rounded-[40px] animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="pt-28 pb-24 px-4 bg-gray-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Command Center</h1>
            <p className="text-gray-500 font-bold italic">Welcome back, {user?.name}. Here's what's happening today.</p>
          </div>
          <div className="flex gap-4">
            <button className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-primary-600 transition-all shadow-sm">
              <Search size={22} />
            </button>
            <button
              onClick={() => navigate('/admin/products/new')}
              className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-black shadow-xl shadow-primary-200 hover:bg-primary-700 hover:-translate-y-1 transition-all flex items-center gap-3"
            >
              <Plus size={20} /> New Item
            </button>
          </div>
        </header>

        {/* Bento Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Main Stat Card */}
          <div className="md:col-span-2 bg-gray-900 rounded-[48px] p-8 text-white relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
                  <TrendingUp className="text-primary-400" size={24} />
                </div>
                <ArrowUpRight className="text-white/20" size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1 italic">Monthly Revenue</p>
                <h2 className="text-5xl font-black italic">₹1,24,500</h2>
              </div>
              <div className="flex gap-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-primary-400 text-sm font-bold italic">
                  <ArrowUpRight size={16} /> +12% vs last month
                </div>
              </div>
            </div>
          </div>

          {/* Product Count */}
          <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-xl hover:shadow-primary-100/30 transition-all">
            <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl w-fit group-hover:bg-primary-600 group-hover:text-white transition-colors duration-500">
              <Package size={24} />
            </div>
            <div>
              <h3 className="text-4xl font-black text-gray-900 italic mb-1">{stats.totalProducts}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">Inventory Items</p>
            </div>
          </div>

          {/* Organic Count */}
          <div className="bg-emerald-50 rounded-[40px] p-8 border border-emerald-100 shadow-sm flex flex-col justify-between group hover:shadow-xl hover:shadow-emerald-100/30 transition-all">
            <div className="p-3 bg-white text-emerald-600 rounded-2xl w-fit shadow-sm">
              <Leaf size={24} />
            </div>
            <div>
              <h3 className="text-4xl font-black text-emerald-700 italic mb-1">{stats.organic}</h3>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest italic">Organic Produce</p>
            </div>
          </div>
        </div>

        {/* Inventory Management */}
        <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900 italic">Inventory Management</h2>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-500">
                <Filter size={14} /> Filters
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Item</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Category</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Price</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.slice(0, 8).map((product) => (
                  <tr key={product.id} className="group hover:bg-primary-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <img src={product.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-50" />
                        <div>
                          <p className="font-black text-gray-900 italic">{product.name}</p>
                          <div className="flex gap-2">
                            {product.isFeatured && <span className="text-[8px] font-black bg-yellow-400/20 text-yellow-700 px-1.5 py-0.5 rounded uppercase">Featured</span>}
                            {product.isOrganic && <span className="text-[8px] font-black bg-emerald-400/20 text-emerald-700 px-1.5 py-0.5 rounded uppercase">Organic</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-bold text-gray-500 text-sm italic">{product.category.name}</td>
                    <td className="px-8 py-5 font-black text-gray-900 italic">₹{product.salePrice || product.price}</td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                        product.isAvailable ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                      )}>
                        {product.isAvailable ? 'In Stock' : 'Stock Out'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-white rounded-xl shadow-sm transition-all"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl shadow-sm transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-8 border-t border-gray-50 text-center">
            <button className="text-sm font-black text-primary-600 hover:underline italic">
              View full inventory history →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Upload,
  Trash2,
  Star,
  Leaf,
  Save,
  CheckCircle2
} from 'lucide-react';
import api from '../../utils/api';
import { cn } from '../../utils/cn';

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

interface Category {
  id: number;
  name: string;
}

const AdminProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
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
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const catRes = await api.get('/categories');
      if (catRes.data.success) setCategories(catRes.data.data);

      if (isEditing) {
        const prodRes = await api.get(`/products/${id}`);
        if (prodRes.data.success) {
          const p = prodRes.data.data;
          setFormData({
            ...p,
            price: p.price.toString(),
            salePrice: p.salePrice?.toString() || '',
            categoryId: p.categoryId.toString(),
            stock: p.stock.toString(),
            weight: p.weight?.toString() || ''
          });
        }
      }
    };
    fetchData();
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
        categoryId: parseInt(formData.categoryId),
        stock: parseInt(formData.stock),
        weight: formData.weight ? parseFloat(formData.weight) : null
      };
      if (isEditing) await api.put(`/products/${id}`, data);
      else await api.post('/products', data);
      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await api.post('/upload', fd);
      if (res.data.success) {
        const url = res.data.data.url;
        setFormData((prev: ProductFormData) => ({
          ...prev,
          thumbnail: prev.thumbnail || url,
          images: [...prev.images, url]
        }));
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pt-28 pb-24 px-4 bg-white min-h-screen">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-primary-600 transition-all italic group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <div className="text-right">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">
              {isEditing ? 'Refine Product' : 'Register New Item'}
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Inventory Management System</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-12">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-12">
            <section className="space-y-6">
              <div className="flex items-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-widest italic pl-2">
                <div className="w-2 h-2 rounded-full bg-primary-600" />
                General Details
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Product Title</label>
                  <input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Organic Alphonso Mango"
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-primary-100 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Unique SKU</label>
                  <input
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="PF-MNG-001"
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-primary-100 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-primary-100 outline-none transition-all font-bold appearance-none bg-select-arrow"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Story / Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    placeholder="Tell the story of where this was grown..."
                    className="w-full px-6 py-6 rounded-3xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-primary-100 outline-none transition-all font-bold resize-none italic"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-widest italic pl-2">
                <div className="w-2 h-2 rounded-full bg-primary-600" />
                Visual Assets
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="aspect-square rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-all text-gray-400 group">
                  <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                    <Upload size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest italic">Add Image</span>
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>
                {formData.images.map((img: string, i: number) => (
                  <div key={i} className="aspect-square rounded-3xl relative group overflow-hidden border border-gray-100">
                    <img src={img} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button type="button" onClick={() => setFormData({ ...formData, thumbnail: img })} className={cn("p-2 rounded-xl", formData.thumbnail === img ? "bg-primary-600 text-white" : "bg-white text-gray-900")}>
                        <CheckCircle2 size={16} />
                      </button>
                      <button type="button" onClick={() => setFormData({ ...formData, images: formData.images.filter((_: string, idx: number) => idx !== i) })} className="p-2 bg-white text-red-500 rounded-xl">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar / Options */}
          <aside className="space-y-8">
            <div className="bg-gray-50 p-8 rounded-[40px] space-y-6">
              <h3 className="text-xl font-black text-gray-900 italic">Inventory & Price</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 italic">MRP (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-5 py-4 rounded-xl bg-white border border-gray-100 outline-none font-black text-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 italic">Sale Price (₹)</label>
                  <input
                    type="number"
                    value={formData.salePrice}
                    onChange={e => setFormData({ ...formData, salePrice: e.target.value })}
                    className="w-full px-5 py-4 rounded-xl bg-white border border-gray-100 outline-none font-black text-lg text-primary-600"
                  />
                </div>
                <div className="space-y-1 pt-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 italic">Stock Count</label>
                  <div className="flex bg-white rounded-xl border border-gray-100 p-1">
                    <button type="button" onClick={() => setFormData({ ...formData, stock: (parseInt(formData.stock) - 1).toString() })} className="p-3 text-gray-400"><Minus size={18} /></button>
                    <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="w-full text-center font-black outline-none" />
                    <button type="button" onClick={() => setFormData({ ...formData, stock: (parseInt(formData.stock) + 1).toString() })} className="p-3 text-gray-400"><Plus size={18} /></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-gray-100 space-y-4 shadow-sm">
              <h3 className="text-lg font-black text-gray-900 italic mb-4">Attributes</h3>
              <label className="flex items-center justify-between p-4 rounded-2xl bg-yellow-50/50 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <Star className="text-yellow-500" size={18} />
                  <span className="text-sm font-bold text-gray-700 italic">Featured Item</span>
                </div>
                <input type="checkbox" checked={formData.isFeatured} onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })} className="w-5 h-5 rounded-lg border-gray-200 text-yellow-500 focus:ring-yellow-400" />
              </label>
              <label className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/50 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <Leaf className="text-emerald-500" size={18} />
                  <span className="text-sm font-bold text-gray-700 italic">Certified Organic</span>
                </div>
                <input type="checkbox" checked={formData.isOrganic} onChange={e => setFormData({ ...formData, isOrganic: e.target.checked })} className="w-5 h-5 rounded-lg border-gray-200 text-emerald-500 focus:ring-emerald-400" />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full py-6 bg-primary-600 text-white rounded-[32px] font-black text-xl shadow-2xl shadow-primary-100 hover:bg-primary-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              <Save size={24} /> {loading ? 'Saving...' : 'Finish & Save'}
            </button>
          </aside>
        </form>
      </div>
    </div>
  );
};

const Minus = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

export default AdminProductForm;

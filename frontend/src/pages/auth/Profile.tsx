import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Shield,
  Key,
  LogOut,
  Edit3,
  ChevronRight,
  Package,
  Heart,
  Bell
} from 'lucide-react';
import { useAuthStore } from '../../context/authStore';
import api from '../../utils/api';
import { cn } from '../../utils/cn';

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  createdAt: string;
  status: string;
  paymentStatus: string;
}

type TabId = 'profile' | 'orders';

const Profile = () => {
  const { user, setAuth, logout } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
    if (activeTab === 'orders' && user) fetchOrders();
  }, [user, navigate, activeTab]);

  const fetchOrders = async () => {
    setFetchingOrders(true);
    try {
      const res = await api.get('/orders');
      if (res.data.success) setOrders(res.data.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setFetchingOrders(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.patch('/auth/profile', { name });
      if (response.data.success) {
        setAuth(response.data.data, localStorage.getItem('token'));
        setIsEditing(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="pt-28 pb-24 px-4 bg-gray-50/30 min-h-screen">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-4 gap-8 items-start">

        {/* Navigation Sidebar */}
        <aside className="lg:col-span-1 space-y-4 sticky top-28 italic">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm text-center space-y-4">
            <div className="w-24 h-24 bg-primary-50 rounded-[32px] mx-auto flex items-center justify-center text-primary-600 border-4 border-white shadow-lg">
              <User size={40} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">{user.name}</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{user.role} Member</p>
            </div>
          </div>

          <nav className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden p-4">
            {[
              { id: 'profile', icon: User, label: 'Profile Settings' },
              { id: 'orders', icon: Package, label: 'Order History' },
              { id: 'wishlist', icon: Heart, label: 'Wishlist' },
              { id: 'notifications', icon: Bell, label: 'Notifications' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => (item.id === 'profile' || item.id === 'orders') ? setActiveTab(item.id as TabId) : null}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl transition-all group",
                  activeTab === item.id ? "bg-primary-50 text-primary-600" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
                <ChevronRight size={14} className={cn("transition-transform group-hover:translate-x-1", activeTab === item.id ? "opacity-100" : "opacity-0")} />
              </button>
            ))}
            <div className="h-px bg-gray-50 my-4 mx-4" />
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-all font-bold text-sm"
            >
              <LogOut size={18} /> Sign Out
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-3 space-y-8">
          {activeTab === 'profile' ? (
            <>
              {/* Profile Section */}
              <section className="bg-white p-10 md:p-12 rounded-[56px] border border-gray-100 shadow-sm space-y-12">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight italic">Personal Profile</h2>
                    <p className="text-gray-400 font-bold italic text-sm mt-1">Manage your account details and preferences.</p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                    >
                      <Edit3 size={20} />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-8 max-w-md">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Full Name</label>
                      <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-primary-100 outline-none transition-all font-bold"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button type="submit" disabled={loading} className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-black shadow-lg shadow-primary-100 hover:bg-primary-700 hover:-translate-y-1 transition-all">
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold hover:bg-gray-100 transition-all">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid md:grid-cols-2 gap-10 italic">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Display Name</p>
                          <p className="font-black text-gray-900">{user.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                          <Mail size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Email Address</p>
                          <p className="font-black text-gray-900">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                          <Shield size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Account Role</p>
                          <span className="text-xs font-black bg-primary-50 text-primary-600 px-3 py-1 rounded-lg uppercase">{user.role}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Security Section */}
              <section className="bg-white p-10 md:p-12 rounded-[56px] border border-gray-100 shadow-sm space-y-10">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight italic flex items-center gap-3">
                  <Key size={24} className="text-gray-400" />
                  Password & Security
                </h3>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-gray-50 rounded-[32px] italic">
                  <div>
                    <p className="font-black text-gray-900">Secure your account</p>
                    <p className="text-sm text-gray-400 font-bold">Recommended to update your password regularly.</p>
                  </div>
                  <button className="px-6 py-3 bg-white border border-gray-200 text-gray-900 rounded-xl font-bold shadow-sm hover:shadow-md transition-all">
                    Update Password
                  </button>
                </div>
              </section>
            </>
          ) : (
            <section className="bg-white p-10 md:p-12 rounded-[56px] border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight italic">Order History</h2>
                  <p className="text-gray-400 font-bold italic text-sm mt-1">Review your past purchases and track deliveries.</p>
                </div>
                <button onClick={fetchOrders} className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-primary-600 transition-all">
                  <Bell size={20} className={fetchingOrders ? 'animate-spin' : ''} />
                </button>
              </div>

              <div className="space-y-6 italic">
                {orders.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                    <Package className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-400 font-bold">No orders found yet.</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-white hover:shadow-xl transition-all">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order {order.orderNumber}</p>
                        <h4 className="font-black text-gray-900 text-lg">₹{order.totalAmount}</h4>
                        <p className="text-xs text-gray-400 font-bold">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-12">
                        <div className="text-right">
                          <span className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                            order.status === 'DELIVERED' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                          )}>
                            {order.status}
                          </span>
                          <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-tighter">{order.paymentStatus}</p>
                        </div>
                        <button className="p-4 bg-white rounded-2xl text-gray-400 hover:text-primary-600 shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Profile;

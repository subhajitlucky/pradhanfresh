import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, ShieldCheck, ShoppingBasket } from 'lucide-react';
import api from '../../utils/api';
import { useAuthStore } from '../../context/authStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      setAuth(user, token);
      navigate('/profile');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4 pt-20">
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-100/50 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100/50 rounded-full blur-[120px] animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-2xl p-10 md:p-12 rounded-[56px] border border-white shadow-2xl shadow-primary-100/30 italic">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-primary-600 rounded-[20px] flex items-center justify-center text-white mb-6 shadow-xl shadow-primary-200">
              <ShoppingBasket size={32} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Welcome Back</h2>
            <p className="text-sm font-bold text-gray-400 mt-2">Log in to your fresh account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-2xl bg-gray-50/50 border border-gray-100 focus:bg-white focus:border-primary-100 focus:ring-4 focus:ring-primary-50 outline-none transition-all font-bold placeholder:text-gray-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-2xl bg-gray-50/50 border border-gray-100 focus:bg-white focus:border-primary-100 focus:ring-4 focus:ring-primary-50 outline-none transition-all font-bold placeholder:text-gray-300"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-5 h-5 rounded-lg border-gray-200 text-primary-600 focus:ring-primary-500" />
                <span className="text-xs font-bold text-gray-400 group-hover:text-gray-600 transition-colors">Remember me</span>
              </label>
              <Link to="/forgot-password" title="Forgot password" className="text-xs font-bold text-primary-600 hover:underline">Forgot password?</Link>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 text-red-500 p-4 rounded-xl text-xs font-bold text-center border border-red-100"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-primary-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-primary-200 hover:bg-primary-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={22} />
            </button>
          </form>

          <p className="mt-10 text-center text-sm font-bold text-gray-400">
            New to PradhanFresh? <Link to="/signup" className="text-primary-600 hover:underline">Create account</Link>
          </p>

          <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-center gap-4 text-gray-300">
            <ShieldCheck size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Secure Global Infrastructure</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { ShoppingBasket, User, Mail, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/signup', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      setSuccess(response.data.message || 'Account created successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4 pt-20 pb-12">
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100/50 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-100/50 rounded-full blur-[120px] animate-pulse relative" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white/80 backdrop-blur-2xl p-10 md:p-14 rounded-[64px] border border-white shadow-2xl shadow-primary-100/30 italic">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-emerald-600 rounded-[24px] flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-200">
              <ShoppingBasket size={32} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Join PradhanFresh</h2>
            <p className="text-sm font-bold text-gray-400 mt-2">Start your journey to a fresher lifestyle</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                  <input
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-14 pr-6 py-5 rounded-2xl bg-gray-50/50 border border-gray-100 focus:bg-white focus:border-emerald-100 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold placeholder:text-gray-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-14 pr-6 py-5 rounded-2xl bg-gray-50/50 border border-gray-100 focus:bg-white focus:border-emerald-100 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold placeholder:text-gray-300"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                  <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-14 pr-6 py-5 rounded-2xl bg-gray-50/50 border border-gray-100 focus:bg-white focus:border-emerald-100 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold placeholder:text-gray-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative group">
                  <CheckCircle2 className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                  <input
                    type="password"
                    placeholder="Confirm"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-14 pr-6 py-5 rounded-2xl bg-gray-50/50 border border-gray-100 focus:bg-white focus:border-emerald-100 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold placeholder:text-gray-300"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="px-2">
              <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-wider text-center">
                By creating an account, you agree to our <Link to="/terms" className="text-emerald-600">Terms of Service</Link> and <Link to="/privacy" className="text-emerald-600">Privacy Policy</Link>.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 text-red-500 p-4 rounded-xl text-xs font-bold text-center border border-red-100"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-xs font-bold text-center border border-emerald-100 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} /> {success}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              {loading ? 'Creating Account...' : 'Ready to Grow'} <ArrowRight size={22} />
            </button>
          </form>

          <p className="mt-10 text-center text-sm font-bold text-gray-400">
            Already have an account? <Link to="/login" className="text-emerald-600 hover:underline">Sign in instead</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
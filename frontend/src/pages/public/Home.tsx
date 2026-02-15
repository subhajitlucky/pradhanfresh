import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Leaf,
  Star,
  ChevronRight,
  TrendingUp,
  Zap
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Mock data for bento grid
const categories = [
  {
    id: 1,
    name: 'Fresh Fruits',
    description: 'Sweet and juicy seasonal picks',
    image: 'https://images.unsplash.com/photo-1619566636858-adb3ef26402b?auto=format&fit=crop&q=80&w=800',
    className: 'md:col-span-2 md:row-span-2',
    color: 'bg-orange-50',
    textColor: 'text-orange-700'
  },
  {
    id: 2,
    name: 'Vegetables',
    description: 'Crisp and nutrient-rich',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800',
    className: 'md:col-span-1 md:row-span-1',
    color: 'bg-green-50',
    textColor: 'text-green-700'
  },
  {
    id: 3,
    name: 'Organic',
    description: '100% Pesticide free',
    image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=800',
    className: 'md:col-span-1 md:row-span-2',
    color: 'bg-emerald-50',
    textColor: 'text-emerald-700'
  },
  {
    id: 4,
    name: 'Leafy Greens',
    description: 'Fresh from the farm',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=800',
    className: 'md:col-span-1 md:row-span-1',
    color: 'bg-lime-50',
    textColor: 'text-lime-700'
  }
];

const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="pt-20 pb-20 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center px-4 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-primary-50/50 rounded-l-[100px] blur-3xl" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-primary-200/30 rounded-full blur-[100px]"
        />

        <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold mb-6">
              <Zap size={16} />
              <span>Fastest Delivery in Town</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
              Freshness Delivered <br />
              <span className="text-primary-600 italic">To Your Door</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-lg leading-relaxed">
              Experience the finest handpicked fruits and vegetables, sourced directly from local farmers and delivered fresh within hours.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/products"
                className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-bold shadow-xl shadow-primary-200 hover:bg-primary-700 hover:-translate-y-1 transition-all flex items-center gap-2 group"
              >
                Shop Now
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-4 bg-white border border-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all">
                How it Works
              </button>
            </div>

            <div className="mt-12 flex items-center gap-8">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-white overflow-hidden bg-gray-200 shadow-sm">
                    <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-yellow-400">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="text-sm font-semibold text-gray-700">5k+ Happy Customers</p>
              </div>
            </div>
          </motion.div>

          {/* Hero Image / Animated Elements */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 rounded-[40px] overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000"
                alt="Fresh Produce"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating Cards */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 z-20 bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-xl flex items-center gap-4 border border-white"
            >
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                <Leaf size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Quality</p>
                <p className="text-sm font-bold text-gray-800">100% Organic</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Orders Completed', value: '50k+', icon: TrendingUp },
            { label: 'Verified Farmers', value: '200+', icon: ShieldCheck },
            { label: 'Freshness Guaranteed', value: '100%', icon: Star },
            { label: 'Fast Delivery', value: '2hr', icon: Truck },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center p-6 rounded-3xl bg-gray-50/50">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm mb-4">
                <stat.icon size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bento Grid Categories */}
      <section className="py-24 px-4 bg-gray-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Shop by Category</h2>
              <p className="text-gray-500 max-w-md italic">Everything you need for a healthy lifestyle, sourced with love.</p>
            </div>
            <Link to="/products" className="flex items-center gap-2 text-primary-600 font-bold hover:underline">
              View All Categories <ChevronRight size={20} />
            </Link>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[600px]"
          >
            {categories.map((cat) => (
              <motion.div
                key={cat.id}
                variants={itemVariants}
                className={cn(
                  "relative rounded-[32px] overflow-hidden group transition-all cursor-pointer",
                  cat.className,
                  cat.color
                )}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-80 transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-8 flex flex-col justify-end">
                  <h3 className="text-2xl font-bold text-white mb-2">{cat.name}</h3>
                  <p className="text-white/80 text-sm mb-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    {cat.description}
                  </p>
                  <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <ArrowRight size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
          {[
            {
              title: 'Direct From Farm',
              desc: 'By cutting out middlemen, we ensure farmers get a fair price and you get the freshest produce.',
              icon: Leaf,
              color: 'text-green-600',
              bg: 'bg-green-50'
            },
            {
              title: 'Eco-Friendly Packing',
              desc: 'We use 100% biodegradable and reusable packaging to keep our planet clean and green.',
              icon: ShieldCheck,
              color: 'text-blue-600',
              bg: 'bg-blue-50'
            },
            {
              title: 'Subscription Ready',
              desc: 'Never run out of essentials. Set up weekly or monthly deliveries at discounted rates.',
              icon: Zap,
              color: 'text-orange-600',
              bg: 'bg-orange-50'
            }
          ].map((feature, i) => (
            <div key={i} className="p-8 rounded-[40px] border border-gray-100 hover:border-primary-100 hover:shadow-xl transition-all group">
              <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center mb-8 transition-transform group-hover:rotate-6", feature.bg, feature.color)}>
                <feature.icon size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed italic">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter / CTA */}
      <section className="px-4 mb-24">
        <div className="max-w-7xl mx-auto rounded-[60px] bg-primary-600 p-12 md:p-24 relative overflow-hidden text-center text-white shadow-2xl shadow-primary-200">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-[100px]" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-[100px]" />
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to taste the freshness?</h2>
          <p className="text-xl text-primary-50 mb-12 max-w-2xl mx-auto italic">
            Join 5,000+ others getting the best produce delivered to their doorstep every morning.
          </p>
          <div className="max-w-md mx-auto relative">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-8 py-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all"
            />
            <button className="mt-4 md:mt-0 md:absolute md:right-2 md:top-2 px-8 py-4 bg-white text-primary-600 font-bold rounded-full shadow-lg hover:bg-primary-50 transition-all">
              Subscribe Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
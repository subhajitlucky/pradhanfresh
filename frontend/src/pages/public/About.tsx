import { motion } from 'framer-motion';
import { Leaf, Users, ArrowRight } from 'lucide-react';

const About = () => {
  return (
    <div className="pt-24 pb-24 bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 mb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <span className="px-6 py-3 bg-primary-50 text-primary-600 rounded-full text-xs font-black uppercase tracking-[0.2em] italic">Our Story</span>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Cultivating a <span className="text-primary-600 italic">Fresh Connection</span> Since 2010.
          </h1>
          <p className="text-xl text-gray-500 italic max-w-2xl mx-auto leading-relaxed">
            We're a family-owned collective bringing the literal fruits (and vegetables) of local harvest directly to your doorstep.
          </p>
        </motion.div>
      </section>

      {/* Philosophy Bento */}
      <section className="max-w-7xl mx-auto px-4 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-gray-900 rounded-[56px] p-12 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 space-y-8 h-full flex flex-col justify-between">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[20px] flex items-center justify-center">
                <Leaf size={32} className="text-primary-400" />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-black italic">Rooted in Ethics.</h3>
                <p className="text-lg text-gray-400 max-w-md italic">
                  Every single piece of produce is vetted for sustainable farming practices. We don't just sell food; we sell a philosophy of conscious living.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-primary-50 rounded-[56px] p-12 flex flex-col justify-between">
            <div className="w-16 h-16 bg-white rounded-[20px] flex items-center justify-center text-primary-600 shadow-sm">
              <Users size={32} />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-gray-900 italic">Community First.</h3>
              <p className="text-gray-500 italic">We support 50+ local farming families in the Green Valley region.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight italic leading-none">The Core Values.</h2>
              <p className="text-gray-500 font-bold italic">What drives us every morning at 4 AM.</p>
            </div>
            <ArrowRight className="text-gray-200 hidden md:block" size={64} />
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: 'Transparency',
                desc: 'Know exactly where your food comes from, with full farm profiles for every item.',
                color: 'text-blue-500'
              },
              {
                title: 'Freshness',
                desc: 'Harvested in the morning, delivered by the evening. Zero cold storage required.',
                color: 'text-emerald-500'
              },
              {
                title: 'Impact',
                desc: '10% of our profits go toward rural education and agricultural tech for farmers.',
                color: 'text-orange-500'
              }
            ].map((v, i) => (
              <div key={i} className="space-y-6 p-8 bg-white rounded-[40px] border border-gray-100 italic group hover:-translate-y-2 transition-transform shadow-sm">
                <div className={`w-3 h-12 ${v.color.replace('text', 'bg')} rounded-full opacity-20 group-hover:opacity-100 transition-opacity`} />
                <h4 className="text-2xl font-black text-gray-900 italic">{v.title}</h4>
                <p className="text-gray-500 leading-relaxed font-bold">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team CTA */}
      <section className="max-w-7xl mx-auto px-4 pt-32 text-center">
        <div className="bg-primary-600 rounded-[64px] p-16 md:p-24 text-white relative overflow-hidden group shadow-2xl shadow-primary-200">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-6xl font-black italic max-w-3xl mx-auto leading-tight">
              Want to see where the magic happens?
            </h2>
            <p className="text-xl text-primary-100 font-bold italic max-w-xl mx-auto">
              We host farm visits every Sunday. Join us for a harvest experience.
            </p>
            <button className="px-10 py-5 bg-white text-primary-600 rounded-3xl font-black text-lg hover:bg-primary-50 transition-all shadow-xl">
              Book a Farm Visit
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;

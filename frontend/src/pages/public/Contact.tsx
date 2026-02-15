import { useState } from 'react';
import { MapPin, Phone, Mail, Send, MessageCircle, HelpCircle, ArrowUpRight } from 'lucide-react';
import { cn } from '../../utils/cn';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Message sent! Our team will reach out shortly.');
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="pt-24 pb-24 bg-gray-50/30">
      <div className="max-w-7xl mx-auto px-4">

        {/* Hero Section */}
        <section className="mb-20 text-left space-y-6">
          <span className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-[0.2em] italic">Reach Out</span>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-tight max-w-4xl">
            We're Here to <span className="text-emerald-600 italic">Listen.</span>
          </h1>
          <p className="text-xl text-gray-500 italic max-w-2xl leading-relaxed">
            Whether you're a farmer looking to partner or a customer with a query, our doors are always open.
          </p>
        </section>

        <div className="grid lg:grid-cols-2 gap-20 items-stretch">
          {/* Info Cards */}
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: Phone, label: 'Call Us', val: '+91 98765 43210', bg: 'bg-blue-50', text: 'text-blue-600' },
                { icon: Mail, label: 'Email Us', val: 'hello@pradhanfresh.com', bg: 'bg-purple-50', text: 'text-purple-600' },
              ].map((item, i) => (
                <div key={i} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm italic group hover:shadow-xl transition-all">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", item.bg, item.text)}>
                    <item.icon size={24} />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="font-black text-gray-900 break-words">{item.val}</p>
                </div>
              ))}
            </div>

            <div className="bg-white p-10 rounded-[56px] border border-gray-100 shadow-sm relative overflow-hidden group italic h-full min-h-[400px]">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center">
                    <MapPin size={32} />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 italic">Our Roots.</h3>
                  <p className="text-lg text-gray-400 font-bold max-w-xs leading-relaxed">
                    123 Fresh Lane, Green Valley,<br />Farm City, Maharashtra - 400001
                  </p>
                </div>
                <button className="flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-widest hover:translate-x-2 transition-transform">
                  View on Google Maps <ArrowUpRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-10 md:p-16 rounded-[64px] border border-gray-100 shadow-2xl shadow-gray-200/50 italic">
            <h2 className="text-3xl font-black text-gray-900 mb-2 italic">Send a Message</h2>
            <p className="text-gray-400 font-bold text-sm mb-12">Expect a response within 24 business hours.</p>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Your Name</label>
                  <input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Rahul S."
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-emerald-100 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rahul@example.com"
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-emerald-100 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Phone Number</label>
                <input
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 XXXXX"
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-emerald-100 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">What's on your mind?</label>
                <textarea
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  placeholder="I'd like to inquire about..."
                  className="w-full px-6 py-6 rounded-3xl bg-gray-50 border border-transparent focus:bg-white focus:border-emerald-100 focus:ring-4 focus:ring-emerald-50 outline-none transition-all font-bold resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-6 bg-emerald-600 text-white rounded-[32px] font-black text-xl shadow-2xl shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
              >
                <Send size={24} /> Send Message
              </button>
            </form>
          </div>
        </div>

        {/* Support Options */}
        <section className="mt-32 grid md:grid-cols-2 gap-12 text-center pb-20">
          <div className="p-12 rounded-[56px] bg-red-50 space-y-6 italic">
            <div className="w-16 h-16 bg-white rounded-3xl mx-auto flex items-center justify-center text-red-500 shadow-sm">
              <HelpCircle size={32} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 italic">Need Help?</h3>
            <p className="text-gray-500 font-bold max-w-xs mx-auto">Check out our frequently asked questions for quick answers.</p>
            <button className="px-8 py-3 bg-white text-red-500 rounded-xl font-black text-sm uppercase tracking-widest shadow-sm hover:shadow-md transition-all">Go to FAQ</button>
          </div>
          <div className="p-12 rounded-[56px] bg-emerald-50 space-y-6 italic">
            <div className="w-16 h-16 bg-white rounded-3xl mx-auto flex items-center justify-center text-emerald-500 shadow-sm">
              <MessageCircle size={32} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 italic">Live Support</h3>
            <p className="text-gray-500 font-bold max-w-xs mx-auto">Our specialists are available Mon-Fri, 9AM to 6PM.</p>
            <button className="px-8 py-3 bg-white text-emerald-500 rounded-xl font-black text-sm uppercase tracking-widest shadow-sm hover:shadow-md transition-all">Start Chat</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contact;

import { Link } from 'react-router-dom';
import {
    ShoppingBasket,
    Facebook,
    Twitter,
    Instagram,
    Mail,
    Phone,
    MapPin,
    ArrowRight
} from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-300 pt-20 pb-10 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                    {/* Brand */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="bg-primary-600 p-2 rounded-xl text-white">
                                <ShoppingBasket size={24} />
                            </div>
                            <span className="text-xl font-bold text-white tracking-tight">PradhanFresh</span>
                        </Link>
                        <p className="text-gray-400 leading-relaxed max-w-xs italic">
                            Empowering local farmers and bringing the freshest, organic produce directly to your doorstep since 2024.
                        </p>
                        <div className="flex gap-4">
                            {[Facebook, Instagram, Twitter].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="w-10 h-10 rounded-full border border-gray-800 flex items-center justify-center hover:bg-primary-600 hover:border-primary-600 hover:text-white transition-all"
                                >
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Quick Links</h4>
                        <ul className="space-y-4">
                            {['Home', 'Products', 'About Us', 'Contact', 'Blog'].map((item) => (
                                <li key={item}>
                                    <Link to={`/${item.toLowerCase().replace(' ', '-')}`} className="hover:text-primary-500 transition-colors flex items-center gap-2 group">
                                        <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Categories</h4>
                        <ul className="space-y-4">
                            {['Fruits', 'Vegetables', 'Organic', 'Dairy', 'Daily Essentials'].map((item) => (
                                <li key={item}>
                                    <Link to="/products" className="hover:text-primary-500 transition-colors flex items-center gap-2 group">
                                        <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Contact Us</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-4 text-gray-400">
                                <MapPin className="text-primary-600 shrink-0" size={20} />
                                <span>123 Fresh Lane, Green Valley, Farm City - 400001</span>
                            </li>
                            <li className="flex items-center gap-4 text-gray-400">
                                <Phone className="text-primary-600 shrink-0" size={20} />
                                <span>+91 98765 43210</span>
                            </li>
                            <li className="flex items-center gap-4 text-gray-400">
                                <Mail className="text-primary-600 shrink-0" size={20} />
                                <span>hello@pradhanfresh.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-10 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500">
                    <p>© 2024 PradhanFresh. All rights reserved.</p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-white transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

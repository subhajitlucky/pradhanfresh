import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="bg-primary-50">
      <div className="container mx-auto px-4">
        <section className="py-20">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 text-primary-800">Welcome to PradhanFresh</h1>
            <p className="text-2xl text-primary-600 italic">Fresh from farm to your table</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105">
              <img src="/placeholder.svg?height=300&width=400" alt="Fresh Fruits" className="w-full h-64 object-cover" />
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-2 text-primary-700">Farm-Fresh Fruits</h2>
                <p className="text-primary-600">Handpicked, juicy, and bursting with flavor.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105">
              <img src="/placeholder.svg?height=300&width=400" alt="Fresh Vegetables" className="w-full h-64 object-cover" />
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-2 text-primary-700">Crisp Vegetables</h2>
                <p className="text-primary-600">Garden-fresh and packed with nutrients.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105">
              <img src="/placeholder.svg?height=300&width=400" alt="Organic Produce" className="w-full h-64 object-cover" />
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-2 text-primary-700">100% Organic</h2>
                <p className="text-primary-600">Certified organic, pesticide-free goodness.</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <Link to="/products" className="bg-secondary-500 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-secondary-600 transition-colors inline-block">
              Shop Now
            </Link>
          </div>
        </section>
        <section className="py-20 bg-white rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary-800">Why Choose PradhanFresh?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🚜</div>
              <h3 className="text-xl font-semibold mb-2 text-primary-700">Direct from Farmers</h3>
              <p className="text-primary-600">We partner with local farmers to bring you the freshest produce.</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🌿</div>
              <h3 className="text-xl font-semibold mb-2 text-primary-700">Organic & Sustainable</h3>
              <p className="text-primary-600">Our products are grown using eco-friendly practices.</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🚚</div>
              <h3 className="text-xl font-semibold mb-2 text-primary-700">Fast & Free Delivery</h3>
              <p className="text-primary-600">Enjoy free delivery on orders over $50 in your area.</p>
            </div>
          </div>
        </section>
        <section className="py-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary-800">Customer Feedback</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <p className="text-primary-600 mb-4">"PradhanFresh has the best produce I've ever tasted! The fruits are always fresh and delicious."</p>
              <p className="text-primary-700 font-semibold">- Susrita</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <p className="text-primary-600 mb-4">"I love the variety of organic vegetables available. It's so convenient to have them delivered to my door."</p>
              <p className="text-primary-700 font-semibold">- Jane Smith</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <p className="text-primary-600 mb-4">"The quality of the produce is unmatched. I highly recommend PradhanFresh to everyone."</p>
              <p className="text-primary-700 font-semibold">- Emily Johnson</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
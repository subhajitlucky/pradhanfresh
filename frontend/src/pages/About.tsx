import React from 'react';

const About = () => {
  return (
    <div className="bg-primary-50 py-20">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-primary-800">About PradhanFresh</h1>
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <p className="mb-6 text-lg text-primary-700">
            PradhanFresh is a family-owned business dedicated to bringing the freshest fruits and vegetables directly from local farms to your table. Our mission is to support local farmers while providing our customers with high-quality, nutritious produce.
          </p>
          <p className="mb-6 text-lg text-primary-700">
            Founded in 2010 by the Pradhan family, our journey began with a small farm stand and has grown into a thriving business that serves our community with pride. We believe in sustainable farming practices and work closely with our network of farmers to ensure that every product meets our high standards.
          </p>
          <p className="mb-6 text-lg text-primary-700">
            At PradhanFresh, we're not just selling fruits and vegetables; we're cultivating a healthier lifestyle and stronger community connections. Join us in our commitment to fresh, local, and sustainable produce.
          </p>
          <div className="mt-8 text-center">
            <h2 className="text-2xl font-semibold mb-4 text-primary-800">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-primary-100 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-2 text-primary-700">Quality</h3>
                <p className="text-primary-600">We never compromise on the quality of our produce.</p>
              </div>
              <div className="bg-primary-100 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-2 text-primary-700">Sustainability</h3>
                <p className="text-primary-600">We support eco-friendly farming practices.</p>
              </div>
              <div className="bg-primary-100 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-2 text-primary-700">Community</h3>
                <p className="text-primary-600">We believe in strengthening local communities.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;


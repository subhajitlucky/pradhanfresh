import React from 'react';
import { Link } from 'react-router-dom';
import freshFruits from '@/assets/images/fresh-fruits.jpg';
import freshVegetables from '@/assets/images/fresh-v.png';
import organicProduce from '@/assets/images/op.png';
import '../styles/home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-main-content">
        <section className="home-hero-section">
          <div className="home-hero-text">
            <h1 className="home-hero-title">Welcome to PradhanFresh</h1>
            <p className="home-hero-subtitle">Fresh from farm to your table</p>
          </div>
          <div className="home-features-grid">
            <div className="home-feature-card">
              <img src={freshFruits} alt="Fresh Fruits" className="home-feature-image" />
              <div className="home-feature-content">
                <h2 className="home-feature-title">Farm-Fresh Fruits</h2>
                <p className="home-feature-description">Handpicked, juicy, and bursting with flavor.</p>
              </div>
            </div>
            <div className="home-feature-card">
              <img src={freshVegetables} alt="Fresh Vegetables" className="home-feature-image" />
              <div className="home-feature-content">
                <h2 className="home-feature-title">Crisp Vegetables</h2>
                <p className="home-feature-description">Garden-fresh and packed with nutrients.</p>
              </div>
            </div>
            <div className="home-feature-card">
              <img src={organicProduce} alt="Organic Produce" className="home-feature-image" />
              <div className="home-feature-content">
                <h2 className="home-feature-title">100% Organic</h2>
                <p className="home-feature-description">Certified organic, pesticide-free goodness.</p>
              </div>
            </div>
          </div>
          <div className="home-cta-section">
            <Link to="/products" className="home-cta-button">
              Shop Now
            </Link>
          </div>
        </section>
        <section className="home-why-section">
          <h2 className="home-why-title">Why Choose PradhanFresh?</h2>
          <div className="home-why-grid">
            <div className="home-why-item">
              <div className="home-why-icon">🚜</div>
              <h3 className="home-why-item-title">Direct from Farmers</h3>
              <p className="home-why-item-description">We partner with local farmers to bring you the freshest produce.</p>
            </div>
            <div className="home-why-item">
              <div className="home-why-icon">🌿</div>
              <h3 className="home-why-item-title">Organic & Sustainable</h3>
              <p className="home-why-item-description">Our products are grown using eco-friendly practices.</p>
            </div>
            <div className="home-why-item">
              <div className="home-why-icon">🚚</div>
              <h3 className="home-why-item-title">Fast & Free Delivery</h3>
              <p className="home-why-item-description">Enjoy free delivery on orders over $50 in your area.</p>
            </div>
          </div>
        </section>
        <section className="home-feedback-section">
          <h2 className="home-feedback-title">Customer Feedback</h2>
          <div className="home-feedback-grid">
            <div className="home-feedback-card">
              <p className="home-feedback-text">"PradhanFresh has the best produce I've ever tasted! The fruits are always fresh and delicious."</p>
              <p className="home-feedback-author">- Susrita</p>
            </div>
            <div className="home-feedback-card">
              <p className="home-feedback-text">"I love the variety of organic vegetables available. It's so convenient to have them delivered to my door."</p>
              <p className="home-feedback-author">- Jane Smith</p>
            </div>
            <div className="home-feedback-card">
              <p className="home-feedback-text">"The quality of the produce is unmatched. I highly recommend PradhanFresh to everyone."</p>
              <p className="home-feedback-author">- Emily Johnson</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
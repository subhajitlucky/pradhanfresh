import React from 'react';
import '../styles/about.css';

const About = () => {
  return (
    <div className="about-container">
      <div className="about-main-content">
        <h1 className="about-title">About PradhanFresh</h1>
        <div className="about-content-wrapper">
          <p className="about-paragraph">
            PradhanFresh is a family-owned business dedicated to bringing the freshest fruits and vegetables directly from local farms to your table. Our mission is to support local farmers while providing our customers with high-quality, nutritious produce.
          </p>
          <p className="about-paragraph">
            Founded in 2010 by the Pradhan family, our journey began with a small farm stand and has grown into a thriving business that serves our community with pride. We believe in sustainable farming practices and work closely with our network of farmers to ensure that every product meets our high standards.
          </p>
          <p className="about-paragraph">
            At PradhanFresh, we're not just selling fruits and vegetables; we're cultivating a healthier lifestyle and stronger community connections. Join us in our commitment to fresh, local, and sustainable produce.
          </p>
          <div className="about-values-section">
            <h2 className="about-values-title">Our Values</h2>
            <div className="about-values-grid">
              <div className="about-value-card">
                <h3 className="about-value-title">Quality</h3>
                <p className="about-value-description">We never compromise on the quality of our produce.</p>
              </div>
              <div className="about-value-card">
                <h3 className="about-value-title">Sustainability</h3>
                <p className="about-value-description">We support eco-friendly farming practices.</p>
              </div>
              <div className="about-value-card">
                <h3 className="about-value-title">Community</h3>
                <p className="about-value-description">We believe in strengthening local communities.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;


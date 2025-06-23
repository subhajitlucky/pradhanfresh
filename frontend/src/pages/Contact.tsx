import React, { useState } from 'react';
import '../styles/contact.css';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface Review {
  name: string;
  message: string;
}

const Contact = () => {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewName, setReviewName] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);
    alert('Thank you for your message. We will get back to you soon!');
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewName && reviewMessage) {
      setReviews([...reviews, { name: reviewName, message: reviewMessage }]);
      setReviewName('');
      setReviewMessage('');
    }
  };

  return (
    <div className="contact-container">
      <div className="contact-main-content">
        <h1 className="contact-title">Contact Us</h1>
        
        <div className="contact-content">
          <div className="contact-info-section">
            <h2 className="contact-info-title">Get in Touch</h2>
            <div className="contact-info-item">
              <div className="contact-info-icon">📍</div>
              <div className="contact-info-details">
                <h3>Address</h3>
                <p>123 Fresh Market St<br />Farm City, FC 12345</p>
              </div>
            </div>
            <div className="contact-info-item">
              <div className="contact-info-icon">📞</div>
              <div className="contact-info-details">
                <h3>Phone</h3>
                <p>+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="contact-info-item">
              <div className="contact-info-icon">✉️</div>
              <div className="contact-info-details">
                <h3>Email</h3>
                <p>hello@pradhanfresh.com</p>
              </div>
            </div>
          </div>

          <div className="contact-form-section">
            <h2 className="contact-form-title">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="contact-form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="contact-form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="contact-form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="contact-form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  required
                ></textarea>
              </div>
              <button type="submit" className="contact-submit-button">
                Send Message
              </button>
            </form>
          </div>
        </div>

        <div className="contact-form-section" style={{ marginTop: 'var(--spacing-12)' }}>
          <h2 className="contact-form-title">Leave a Review</h2>
          <form onSubmit={handleReviewSubmit} className="contact-form">
            <div className="contact-form-group">
              <label htmlFor="reviewName">Name</label>
              <input
                type="text"
                id="reviewName"
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                required
              />
            </div>
            <div className="contact-form-group">
              <label htmlFor="reviewMessage">Review</label>
              <textarea
                id="reviewMessage"
                value={reviewMessage}
                onChange={(e) => setReviewMessage(e.target.value)}
                rows={4}
                required
              ></textarea>
            </div>
            <button type="submit" className="contact-submit-button">
              Submit Review
            </button>
          </form>

          {reviews.length > 0 && (
            <div style={{ marginTop: 'var(--spacing-8)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-4)', color: 'var(--color-text-primary)' }}>Customer Reviews</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                {reviews.map((review, index) => (
                  <div key={index} style={{
                    padding: 'var(--spacing-4)',
                    backgroundColor: 'var(--color-background-alt)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)'
                  }}>
                    <p style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)', color: 'var(--color-text-primary)' }}>
                      {review.name}
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                      {review.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;


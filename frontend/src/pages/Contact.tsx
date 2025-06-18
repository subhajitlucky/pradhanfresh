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
        <div className="contact-content-wrapper">
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="contact-form-group">
              <label htmlFor="name" className="contact-form-label">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="contact-form-input"
                required
              />
            </div>
            <div className="contact-form-group">
              <label htmlFor="email" className="contact-form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="contact-form-input"
                required
              />
            </div>
            <div className="contact-form-group">
              <label htmlFor="phone" className="contact-form-label">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="contact-form-input"
                required
              />
            </div>
            <div className="contact-form-group">
              <label htmlFor="message" className="contact-form-label">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                className="contact-form-textarea"
                rows={4}
                required
              ></textarea>
            </div>
            <button type="submit" className="contact-submit-button">
              Send Message
            </button>
          </form>

          <div className="contact-reviews-section">
            <h2 className="contact-section-title">Leave a Review</h2>
            <form onSubmit={handleReviewSubmit}>
              <div className="contact-form-group">
                <label htmlFor="reviewName" className="contact-form-label">Name</label>
                <input
                  type="text"
                  id="reviewName"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  className="contact-form-input"
                  required
                />
              </div>
              <div className="contact-form-group">
                <label htmlFor="reviewMessage" className="contact-form-label">Review</label>
                <textarea
                  id="reviewMessage"
                  value={reviewMessage}
                  onChange={(e) => setReviewMessage(e.target.value)}
                  className="contact-form-textarea"
                  rows={4}
                  required
                ></textarea>
              </div>
              <button type="submit" className="contact-submit-button">
                Submit Review
              </button>
            </form>
          </div>

          <div>
            <h2 className="contact-section-title">Customer Reviews</h2>
            {reviews.length === 0 ? (
              <p className="contact-no-reviews">No reviews yet. Be the first to leave a review!</p>
            ) : (
              <ul className="contact-reviews-list">
                {reviews.map((review, index) => (
                  <li key={index} className="contact-review-item">
                    <p className="contact-review-name">{review.name}</p>
                    <p className="contact-review-text">{review.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;


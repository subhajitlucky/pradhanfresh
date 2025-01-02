import React, { useState } from 'react';

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
    <div className="bg-primary-50 py-20">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-primary-800">Contact Us</h1>
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <form onSubmit={handleSubmit} className="mb-12">
            <div className="mb-4">
              <label htmlFor="name" className="block mb-2 text-primary-700">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block mb-2 text-primary-700">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="phone" className="block mb-2 text-primary-700">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="message" className="block mb-2 text-primary-700">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={4}
                required
              ></textarea>
            </div>
            <button type="submit" className="bg-secondary-500 text-white px-6 py-2 rounded-full hover:bg-secondary-600 transition-colors">
              Send Message
            </button>
          </form>

          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-primary-800">Leave a Review</h2>
            <form onSubmit={handleReviewSubmit}>
              <div className="mb-4">
                <label htmlFor="reviewName" className="block mb-2 text-primary-700">Name</label>
                <input
                  type="text"
                  id="reviewName"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="reviewMessage" className="block mb-2 text-primary-700">Review</label>
                <textarea
                  id="reviewMessage"
                  value={reviewMessage}
                  onChange={(e) => setReviewMessage(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  required
                ></textarea>
              </div>
              <button type="submit" className="bg-secondary-500 text-white px-6 py-2 rounded-full hover:bg-secondary-600 transition-colors">
                Submit Review
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4 text-primary-800">Customer Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-primary-600">No reviews yet. Be the first to leave a review!</p>
            ) : (
              <ul className="space-y-4">
                {reviews.map((review, index) => (
                  <li key={index} className="bg-primary-100 p-4 rounded">
                    <p className="font-semibold text-primary-700">{review.name}</p>
                    <p className="text-primary-600">{review.message}</p>
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


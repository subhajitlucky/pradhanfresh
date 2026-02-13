import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import '../../styles/pages/checkout.css';

const Checkout: React.FC = () => {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [deliverySlot, setDeliverySlot] = useState('MORNING');

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    // In a real app, call API to create order
    // const response = await createOrder({ ...address, deliverySlot, cart });
    console.log('Order Submitted', { address, deliverySlot, cart });
    alert('Order Placed Successfully!');
    clearCart();
    navigate('/profile');
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Your cart is empty</h2>
        <button onClick={() => navigate('/products')}>Go Shopping</button>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-steps">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>Address</div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>Delivery Slot</div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>Summary</div>
      </div>

      <div className="checkout-content">
        {step === 1 && (
          <div className="step-content">
            <h3>Delivery Address</h3>
            <div className="form-group">
              <input name="fullName" placeholder="Full Name" value={address.fullName} onChange={handleAddressChange} />
              <input name="phone" placeholder="Phone" value={address.phone} onChange={handleAddressChange} />
              <input name="addressLine1" placeholder="Address Line 1" value={address.addressLine1} onChange={handleAddressChange} />
              <div className="form-row">
                <input name="city" placeholder="City" value={address.city} onChange={handleAddressChange} />
                <input name="state" placeholder="State" value={address.state} onChange={handleAddressChange} />
                <input name="pincode" placeholder="Pincode" value={address.pincode} onChange={handleAddressChange} />
              </div>
            </div>
            <button className="btn-primary" onClick={handleNext}>Next: Delivery Slot</button>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <h3>Select Delivery Slot</h3>
            <div className="slots">
              {['MORNING', 'AFTERNOON', 'EVENING'].map(slot => (
                <div 
                  key={slot} 
                  className={`slot-card ${deliverySlot === slot ? 'selected' : ''}`}
                  onClick={() => setDeliverySlot(slot)}
                >
                  {slot}
                </div>
              ))}
            </div>
            <div className="button-group">
              <button onClick={handleBack}>Back</button>
              <button className="btn-primary" onClick={handleNext}>Next: Summary</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <h3>Order Summary</h3>
            <div className="summary-details">
              <div className="summary-section">
                <h4>Shipping to:</h4>
                <p>{address.fullName}, {address.addressLine1}, {address.city}</p>
              </div>
              <div className="summary-section">
                <h4>Items:</h4>
                {cart.items.map(item => (
                  <div key={item.id} className="summary-item">
                    <span>{item.product.name} x {item.quantity}</span>
                    <span>₹{item.subtotal}</span>
                  </div>
                ))}
              </div>
              <div className="summary-total">
                <strong>Total: ₹{cart.totalAmount}</strong>
              </div>
            </div>
            <div className="button-group">
              <button onClick={handleBack}>Back</button>
              <button className="btn-primary" onClick={handleSubmit}>Place Order</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;

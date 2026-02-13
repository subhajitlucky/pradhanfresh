import React from 'react';

const StripePayment: React.FC<{ amount: number, onConfirm: () => void }> = ({ amount, onConfirm }) => {
  return (
    <div className="stripe-payment-mock">
      <h4>Payment Details</h4>
      <div className="card-input-simulation">
        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '10px' }}>
          🔒 [Stripe Card Element Simulation]
        </div>
        <p style={{ fontSize: '0.8rem', color: '#666' }}>Pay securely with Stripe</p>
      </div>
      <button 
        style={{ width: '100%', padding: '12px', background: '#6772e5', color: 'white', border: 'none', borderRadius: '4px', marginTop: '10px', fontWeight: 'bold' }}
        onClick={onConfirm}
      >
        Pay ₹{amount}
      </button>
    </div>
  );
};

export default StripePayment;

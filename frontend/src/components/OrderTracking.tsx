import React from 'react';
import '../../styles/components/OrderTracking.css';

interface OrderTrackingProps {
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ status }) => {
  const steps = [
    { label: 'Ordered', value: 'PENDING' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Shipped', value: 'SHIPPED' },
    { label: 'Delivered', value: 'DELIVERED' },
  ];

  const currentStep = steps.findIndex(step => step.value === status);

  return (
    <div className="tracking-wrapper">
      <div className="tracking-line">
        {steps.map((step, index) => (
          <div key={step.value} className={`tracking-step ${index <= currentStep ? 'completed' : ''}`}>
            <div className="step-dot"></div>
            <span className="step-label">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderTracking;

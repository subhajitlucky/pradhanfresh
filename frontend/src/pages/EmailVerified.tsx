import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import '../styles/forms.css';

const EmailVerified = () => {
  const [message, setMessage] = useState('Verifying your email...');
  const [error, setError] = useState('');
  const { token } = useParams<{ token: string }>();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Invalid verification link.');
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        setMessage(response.data.message);
      } catch (err: any) {
        if (err.response && err.response.data && err.response.data.error) {
          setError(err.response.data.error);
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="form-container">
      <h2>Email Verification</h2>
      {error ? (
        <p className="error-message">{error}</p>
      ) : (
        <p className="success-message">{message}</p>
      )}
      <p className="form-link">
        <Link to="/login">Proceed to Login</Link>
      </p>
    </div>
  );
};

export default EmailVerified; 
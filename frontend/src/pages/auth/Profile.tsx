import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './../../styles/pages/auth.css';

const Profile = () => {
  const { user, token, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  if (!user) return <div className="loading-spinner"></div>;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.patch('/auth/profile', { name });
      if (response.data.success) {
        updateUser(response.data.data);
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Update failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return setMessage({ type: 'error', text: 'New passwords do not match' });
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/profile/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswords({ current: '', new: '', confirm: '' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Password change failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page container">
      <div className="profile-card">
        <h1>My Account</h1>
        
        {message.text && (
          <div className={`alert ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="profile-section">
          <h3>Personal Information</h3>
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="profile-form">
              <div className="form-group">
                <label>Display Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
              <div className="button-group">
                <button type="submit" className="btn-primary" disabled={loading}>Save Changes</button>
                <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="profile-display">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> <span className="badge-role">{user.role}</span></p>
              <button className="btn-outline" onClick={() => setIsEditing(true)}>Edit Profile</button>
            </div>
          )}
        </div>

        <div className="profile-section">
          <h3>Security</h3>
          <form onSubmit={handleChangePassword} className="profile-form">
            <div className="form-group">
              <label>Current Password</label>
              <input 
                type="password" 
                value={passwords.current}
                onChange={(e) => setPasswords({...passwords, current: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input 
                type="password" 
                value={passwords.new}
                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input 
                type="password" 
                value={passwords.confirm}
                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
              />
            </div>
            <button type="submit" className="btn-secondary" disabled={loading}>Change Password</button>
          </form>
        </div>

        <div className="profile-footer">
          <button className="btn-danger" onClick={logout}>Sign Out</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

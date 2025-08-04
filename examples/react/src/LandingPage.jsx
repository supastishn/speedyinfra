import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

const LandingPage = () => {
  const { resetAllData } = useAuth();

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all local data? This cannot be undone.')) {
      resetAllData();
    }
  };

  return (
    <div className="landing-container">
      <h1>Welcome to SpeedyInfra</h1>
      <p>A blazing fast backend service for your applications</p>
      <div className="landing-features">
        <div className="feature-card">
          <h3>Database Tables</h3>
          <p>Manage your data with our powerful table API</p>
        </div>
        <div className="feature-card">
          <h3>User Management</h3>
          <p>Secure authentication and user profiles</p>
        </div>
        <div className="feature-card">
          <h3>Document Storage</h3>
          <p>Store and manage your files effortlessly</p>
        </div>
      </div>
      <Link to="/app" className="primary-btn">Get Started</Link>
      <div style={{ marginTop: '2rem' }}>
        <button onClick={handleReset} className="danger primary-btn">
          Reset All Local Data
        </button>
      </div>
    </div>
  );
};

export default LandingPage;

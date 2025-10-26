import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in (on app start)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setCurrentUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (authData) => {
    setCurrentUser(authData.user);
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(authData.user));
    console.log('User logged in:', authData.user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('User logged out');
  };

  if (loading) {
    return (
      <div className="app">
        <div className="container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (currentUser) {
    return <Dashboard user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="app">
      <div className="container">
        <div className="auth-container">
          <div className="auth-header">
            <h1>🚀 P2P Currency Exchange</h1>
            <p>Trade currencies securely with people worldwide</p>
          </div>

          {showLogin ? (
            <>
              <Login onLogin={handleLogin} />
              <div className="auth-switch">
                <p>Don't have an account?{' '}
                  <span className="switch-link" onClick={() => setShowLogin(false)}>
                    Sign up here
                  </span>
                </p>
              </div>
            </>
          ) : (
            <>
              <Register onLogin={handleLogin} />
              <div className="auth-switch">
                <p>Already have an account?{' '}
                  <span className="switch-link" onClick={() => setShowLogin(true)}>
                    Login here
                  </span>
                </p>
              </div>
            </>
          )}

          <div className="features">
            <h3>Why Choose Our Platform?</h3>
            <div className="feature-list">
              <div className="feature">🔒 Secure Transactions</div>
              <div className="feature">🌍 Global Marketplace</div>
              <div className="feature">⚡ Fast Verification</div>
              <div className="feature">💼 Multiple Payment Methods</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
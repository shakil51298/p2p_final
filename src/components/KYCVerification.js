import React, { useState } from 'react';
import axios from 'axios';

const KYCVerification = ({ user, onKYCVerified }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const verifyKYC = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/kyc/verify-user', {
        userId: user.id
      });
      
      setMessage('✅ KYC verification successful! You can now create ads.');
      if (onKYCVerified) {
        onKYCVerified(response.data.user);
      }
    } catch (error) {
      setMessage('❌ Error verifying KYC: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kyc-verification">
      <div className="kyc-card">
        <h3>🔐 KYC Verification Required</h3>
        <p>To create trading ads and ensure platform security, please complete KYC verification.</p>
        
        <div className="kyc-steps">
          <h4>Verification Steps:</h4>
          <ol>
            <li>Submit government-issued ID</li>
            <li>Take a selfie for facial recognition</li>
            <li>Verify your address</li>
          </ol>
        </div>

        <div className="kyc-actions">
          <button 
            onClick={verifyKYC}
            disabled={loading}
            className="verify-btn"
          >
            {loading ? 'Verifying...' : '🎯 Simulate KYC Verification (Development)'}
          </button>
          
          <p className="kyc-note">
            <small>
              In production, this would integrate with services like Onfido or Jumio.
              For development, we're simulating verification.
            </small>
          </p>
        </div>

        {message && (
          <div className={`kyc-message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default KYCVerification;
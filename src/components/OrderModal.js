import React, { useState } from 'react';
import axios from 'axios';

const OrderModal = ({ ad, user, onClose, onOrderCreated }) => { // Add user here
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Add debug to check if user is available
  console.log('🔴 OrderModal - User prop:', user);

  const calculateTotal = () => {
    if (!amount || !ad) return 0;
    return (parseFloat(amount) * ad.exchange_rate).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    console.log('🔴 OrderModal: Submit started');
    console.log('🔴 User:', user); // Check if user object has id

    // Check if user is available
    if (!user || !user.id) {
      setError('User not found. Please log in again.');
      setLoading(false);
      return;
    }
  
    try {
      const orderData = {
        ad_id: ad.id,
        amount: parseFloat(amount),
        buyer_id: user.id // Send the actual logged-in user ID
      };
  
      console.log('🔴 Sending order data:', orderData);
  
      const response = await axios.post('http://localhost:50000/api/orders/create', orderData); // Fixed port to 5000
      console.log('🟢 Order created successfully:', response.data);
      onOrderCreated(response.data.order);
      
    } catch (err) {
      console.error('🔴 Order creation error:', err);
      const errorMessage = err.response?.data?.message || 'Error creating order';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Start Trade</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="order-details">
          <h3>Trade Details</h3>
          <div className="trade-pair">
            <span className="currency">{ad.currency_from}</span>
            <span className="arrow">→</span>
            <span className="currency">{ad.currency_to}</span>
          </div>
          <div className="exchange-rate">
            1 {ad.currency_from} = {ad.exchange_rate} {ad.currency_to}
          </div>
          <div className="seller-info">
            Seller: {ad.seller_name}
            {ad.seller_kyc_status === 'verified' && (
              <span className="kyc-badge">✅ KYC Verified</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="order-form">
          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="form-group">
            <label>Amount to {ad.type === 'sell' ? 'buy' : 'sell'} ({ad.currency_from}):</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={ad.min_amount}
              max={ad.amount_available}
              step="0.01"
              required
              placeholder={`Enter amount between ${ad.min_amount} and ${ad.amount_available}`}
            />
            <div className="amount-limits">
              Min: {ad.min_amount} {ad.currency_from} | 
              Max: {ad.amount_available} {ad.currency_from} {/* Fixed: should be amount_available, not max_amount */}
            </div>
          </div>

          <div className="calculation">
            <div className="calculation-row">
              <span>You will {ad.type === 'sell' ? 'receive' : 'pay'}:</span>
              <strong>{calculateTotal()} {ad.currency_to}</strong>
            </div>
            <div className="calculation-row">
              <span>Exchange rate:</span>
              <span>1 {ad.currency_from} = {ad.exchange_rate} {ad.currency_to}</span>
            </div>
          </div>

          <div className="payment-methods">
            <h4>Accepted Payment Methods:</h4>
            <div className="methods-list">
              {ad.payment_methods.map((method, index) => (
                <span key={index} className="payment-method">{method}</span>
              ))}
            </div>
          </div>

          <div className="order-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || !amount} 
              className="submit-btn"
            >
              {loading ? 'Creating Order...' : 'Confirm Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;
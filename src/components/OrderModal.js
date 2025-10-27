import React, { useState } from 'react';
import axios from 'axios';

const OrderModal = ({ ad, onClose, onOrderCreated }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateTotal = () => {
    if (!amount || !ad) return 0;
    return (parseFloat(amount) * ad.exchange_rate).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/orders/create', {
        ad_id: ad.id,
        amount: parseFloat(amount)
      });

      console.log('Order created:', response.data);
      onOrderCreated(response.data.order);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating order');
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
          {error && <div className="error-message">{error}</div>}

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
            />
            <div className="amount-limits">
              Min: {ad.min_amount} {ad.currency_from} | 
              Max: {ad.amount_available} {ad.currency_from}
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
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Creating Order...' : 'Confirm Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;
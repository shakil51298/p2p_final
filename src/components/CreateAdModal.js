import React, { useState } from 'react';
import axios from 'axios';

const CreateAdModal = ({ onClose, onAdCreated, user }) => {
  const [formData, setFormData] = useState({
    type: 'sell',
    currency_from: 'RMB',
    currency_to: 'BDT',
    exchange_rate: '',
    amount_available: '',
    min_amount: '10',
    max_amount: '1000',
    payment_methods: [],
    terms: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const paymentOptions = ['Bank Transfer', 'PayPal', 'Wise', 'Revolut', 'Cash', 'Other'];
  const currencyOptions = ['RMB', 'BDT', 'DHS', 'CAD', 'AUD', 'JPY', 'CNY', 'INR'];

  const handlePaymentMethodToggle = (method) => {
    setFormData(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(method)
        ? prev.payment_methods.filter(m => m !== method)
        : [...prev.payment_methods, method]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      const adData = {
        ...formData,
        user_id: user.id // Send the actual logged-in user ID
      };
  
      console.log('📤 Creating ad for user:', user.id, adData);
  
      const response = await axios.post('http://localhost:50000/api/ads/create', adData);
      console.log('🟢 Ad created:', response.data);
      onAdCreated();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error creating ad';
      setError(errorMessage);
      console.error('Ad creation error:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Trading Ad</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="ad-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>I want to:</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="sell"
                  checked={formData.type === 'sell'}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                />
                Sell Currency
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="buy"
                  checked={formData.type === 'buy'}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                />
                Buy Currency
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>From Currency:</label>
              <select
                value={formData.currency_from}
                onChange={(e) => setFormData({...formData, currency_from: e.target.value})}
              >
                {currencyOptions.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>To Currency:</label>
              <select
                value={formData.currency_to}
                onChange={(e) => setFormData({...formData, currency_to: e.target.value})}
              >
                {currencyOptions.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Exchange Rate (1 {formData.currency_from} = ? {formData.currency_to}):</label>
            <input
              type="number"
              step="0.0001"
              value={formData.exchange_rate}
              onChange={(e) => setFormData({...formData, exchange_rate: e.target.value})}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group">
            <label>Amount Available ({formData.currency_from}):</label>
            <input
              type="number"
              value={formData.amount_available}
              onChange={(e) => setFormData({...formData, amount_available: e.target.value})}
              placeholder="1000"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Min Amount ({formData.currency_from}):</label>
              <input
                type="number"
                value={formData.min_amount}
                onChange={(e) => setFormData({...formData, min_amount: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Max Amount ({formData.currency_from}):</label>
              <input
                type="number"
                value={formData.max_amount}
                onChange={(e) => setFormData({...formData, max_amount: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Payment Methods:</label>
            <div className="payment-methods-grid">
              {paymentOptions.map(method => (
                <label key={method} className="payment-method-label">
                  <input
                    type="checkbox"
                    checked={formData.payment_methods.includes(method)}
                    onChange={() => handlePaymentMethodToggle(method)}
                  />
                  {method}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Terms & Conditions (optional):</label>
            <textarea
              value={formData.terms}
              onChange={(e) => setFormData({...formData, terms: e.target.value})}
              placeholder="Any specific terms for the trade..."
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="submit-btn"
            >
              {loading ? 'Creating...' : 'Create Ad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAdModal;
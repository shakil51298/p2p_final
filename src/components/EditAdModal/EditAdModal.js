import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EditAdModal.css';

const EditAdModal = ({ ad, user, onClose, onAdUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    exchange_rate: '',
    amount_available: '',
    min_amount: '',
    max_amount: '',
    payment_methods: [],
    terms: ''
  });

  const paymentOptions = [
    'Bank Transfer',
    'PayPal',
    'Wise',
    'Revolut',
    'Cash',
    'Credit Card',
    'Debit Card',
    'Skrill',
    'Neteller',
    'Payoneer'
  ];

  useEffect(() => {
    if (ad) {
      // Parse payment methods safely
      let parsedPaymentMethods = [];
      try {
        parsedPaymentMethods = ad.payment_methods ? JSON.parse(ad.payment_methods) : [];
      } catch (error) {
        console.error('Error parsing payment methods:', error);
        parsedPaymentMethods = [];
      }

      setFormData({
        title: ad.title || `${ad.type === 'buy' ? 'Buy' : 'Sell'} ${ad.currency_from} for ${ad.currency_to}`,
        exchange_rate: ad.price || ad.exchange_rate || '',
        amount_available: ad.available_amount || ad.amount_available || '',
        min_amount: ad.min_amount || '',
        max_amount: ad.max_amount || '',
        payment_methods: parsedPaymentMethods,
        terms: ad.terms || ''
      });
    }
  }, [ad]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentMethodChange = (method) => {
    setFormData(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(method)
        ? prev.payment_methods.filter(m => m !== method)
        : [...prev.payment_methods, method]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const updateData = {
        title: formData.title,
        exchange_rate: parseFloat(formData.exchange_rate),
        amount_available: parseFloat(formData.amount_available),
        min_amount: parseFloat(formData.min_amount),
        max_amount: parseFloat(formData.max_amount),
        payment_methods: formData.payment_methods,
        terms: formData.terms
      };

      console.log('🟡 Updating ad:', ad.id, updateData);
      
      // Use POST instead of PUT
      const response = await axios.post(`http://localhost:50000/api/ads/${ad.id}/update`, updateData);
      
      console.log('✅ Ad updated successfully:', response.data);
      alert('Ad updated successfully!');
      onAdUpdated();
      onClose();
      
    } catch (error) {
      console.error('🔴 Error updating ad:', error);
      console.error('🔴 Error details:', error.response?.data);
      alert(`Failed to update ad: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!ad) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content edit-ad-modal">
        <div className="modal-header">
          <h2>✏️ Edit Ad</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="ad-info">
          <p><strong>Type:</strong> {ad.type === 'buy' ? 'Buy' : 'Sell'}</p>
          <p><strong>Pair:</strong> {ad.currency_from} / {ad.currency_to}</p>
          <p><strong>Status:</strong> <span className={`status-${ad.status}`}>{ad.status}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="edit-ad-form">
          <div className="form-group">
            <label>Ad Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter ad title"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Exchange Rate ({ad.currency_to}) *</label>
              <input
                type="number"
                name="exchange_rate"
                value={formData.exchange_rate}
                onChange={handleInputChange}
                step="0.01"
                min="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Available Amount ({ad.currency_from}) *</label>
              <input
                type="number"
                name="amount_available"
                value={formData.amount_available}
                onChange={handleInputChange}
                step="0.00000001"
                min="0.00000001"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Minimum Amount ({ad.currency_from}) *</label>
              <input
                type="number"
                name="min_amount"
                value={formData.min_amount}
                onChange={handleInputChange}
                step="0.00000001"
                min="0.00000001"
                required
              />
            </div>

            <div className="form-group">
              <label>Maximum Amount ({ad.currency_from}) *</label>
              <input
                type="number"
                name="max_amount"
                value={formData.max_amount}
                onChange={handleInputChange}
                step="0.00000001"
                min="0.00000001"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Payment Methods</label>
            <div className="payment-methods-grid">
              {paymentOptions.map(method => (
                <label key={method} className="payment-method-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.payment_methods.includes(method)}
                    onChange={() => handlePaymentMethodChange(method)}
                  />
                  <span>{method}</span>
                </label>
              ))}
            </div>
            <small>Selected: {formData.payment_methods.length} methods</small>
          </div>

          <div className="form-group">
            <label>Terms & Conditions</label>
            <textarea
              name="terms"
              value={formData.terms}
              onChange={handleInputChange}
              placeholder="Enter any specific terms or conditions for this trade..."
              rows="4"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? '🔄 Updating...' : '💾 Update Ad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAdModal;
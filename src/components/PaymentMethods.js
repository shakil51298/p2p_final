import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PaymentMethods = ({ user }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    method_type: 'bank',
    provider_name: '',
    account_name: '',
    account_number: '',
    bank_name: '',
    branch_code: '',
    wallet_address: '',
    phone_number: '',
    is_default: false
  });

  useEffect(() => {
    loadPaymentMethods();
  }, [user.id]);

  const loadPaymentMethods = async () => {
    try {
      const response = await axios.get(`http://localhost:50000/api/payments/methods/${user.id}`);
      setPaymentMethods(response.data);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('http://localhost:50000/api/payments/methods', {
        ...formData,
        user_id: user.id
      });

      setShowAddForm(false);
      setFormData({
        method_type: 'bank',
        provider_name: '',
        account_name: '',
        account_number: '',
        bank_name: '',
        branch_code: '',
        wallet_address: '',
        phone_number: '',
        is_default: false
      });
      
      loadPaymentMethods();
      alert('Payment method added successfully!');
    } catch (error) {
      console.error('Error adding payment method:', error);
      alert(error.response?.data?.message || 'Error adding payment method');
    } finally {
      setLoading(false);
    }
  };

  const deletePaymentMethod = async (methodId) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) return;

    try {
      await axios.delete(`http://localhost:50000/api/payments/methods/${methodId}`);
      loadPaymentMethods();
      alert('Payment method deleted successfully!');
    } catch (error) {
      console.error('Error deleting payment method:', error);
      alert('Error deleting payment method');
    }
  };

  const getMethodDisplay = (method) => {
    switch (method.method_type) {
      case 'bank':
        return `${method.bank_name} - ${method.account_number} (${method.account_name})`;
      case 'digital_wallet':
        return `${method.provider_name} - ${method.wallet_address}`;
      case 'cash':
        return `${method.provider_name} - ${method.phone_number}`;
      default:
        return method.provider_name;
    }
  };

  return (
    <div className="payment-methods">
      <div className="section-header">
        <h2>💰 Payment Methods</h2>
        <button 
          className="primary-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add Payment Method
        </button>
      </div>

      {paymentMethods.length === 0 ? (
        <div className="no-data">
          <p>No payment methods added yet.</p>
        </div>
      ) : (
        <div className="methods-list">
          {paymentMethods.map(method => (
            <div key={method.id} className="method-card">
              <div className="method-info">
                <div className="method-type">{method.method_type.toUpperCase()}</div>
                <div className="method-details">{getMethodDisplay(method)}</div>
                {method.is_default && <span className="default-badge">Default</span>}
              </div>
              <div className="method-actions">
                <button 
                  className="danger-btn"
                  onClick={() => deletePaymentMethod(method.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Payment Method</h3>
              <button className="close-btn" onClick={() => setShowAddForm(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="payment-form">
              <div className="form-group">
                <label>Method Type:</label>
                <select
                  value={formData.method_type}
                  onChange={(e) => setFormData({...formData, method_type: e.target.value})}
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="digital_wallet">Digital Wallet</option>
                  <option value="cash">Cash Payment</option>
                </select>
              </div>

              <div className="form-group">
                <label>Provider Name:</label>
                <input
                  type="text"
                  value={formData.provider_name}
                  onChange={(e) => setFormData({...formData, provider_name: e.target.value})}
                  placeholder="e.g., Chase Bank, PayPal, bKash"
                  required
                />
              </div>

              {formData.method_type === 'bank' && (
                <>
                  <div className="form-group">
                    <label>Account Name:</label>
                    <input
                      type="text"
                      value={formData.account_name}
                      onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Account Number:</label>
                    <input
                      type="text"
                      value={formData.account_number}
                      onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Bank Name:</label>
                    <input
                      type="text"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Branch Code (Optional):</label>
                    <input
                      type="text"
                      value={formData.branch_code}
                      onChange={(e) => setFormData({...formData, branch_code: e.target.value})}
                    />
                  </div>
                </>
              )}

              {formData.method_type === 'digital_wallet' && (
                <div className="form-group">
                  <label>Wallet Address:</label>
                  <input
                    type="text"
                    value={formData.wallet_address}
                    onChange={(e) => setFormData({...formData, wallet_address: e.target.value})}
                    required
                  />
                </div>
              )}

              {formData.method_type === 'cash' && (
                <div className="form-group">
                  <label>Phone Number:</label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    required
                  />
                </div>
              )}

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                  />
                  Set as default payment method
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowAddForm(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? 'Adding...' : 'Add Payment Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;
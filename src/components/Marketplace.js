import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CreateAdModal from './CreateAdModal';
import OrderModal from './OrderModal';

const Marketplace = ({ user }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:50000/api/ads/marketplace');
      console.log("market place loaded ads");
      setAds(response.data);
    } catch (error) {
      console.error('Error fetching ads:', error);
      setError('Failed to load marketplace ads. Please try again.');
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAds = ads.filter(ad => {
    if (filter === 'all') return true;
    return ad.type === filter;
  });

  const handleAdCreated = () => {
    setShowCreateModal(false);
    fetchAds(); // Refresh the list
  };

  const handleStartTrade = (ad) => {
    console.log('Starting trade with ad:', ad);
    setSelectedAd(ad);
    setShowOrderModal(true);
  };

  const handleOrderCreated = (order) => {
    setShowOrderModal(false);
    setSelectedAd(null);
    fetchAds(); // Refresh ads to update available amounts
    alert(`Order created successfully! Order ID: ${order.id}`);
  };

  // Ad Card Component - Moved INSIDE Marketplace component
  const AdCard = ({ ad }) => {
    const getTypeColor = () => {
      return ad.type === 'buy' ? '#28a745' : '#dc3545';
    };

    const getTypeText = () => {
      return ad.type === 'buy' ? 'Wants to BUY' : 'Wants to SELL';
    };

    return (
      <div className="ad-card">
        <div className="ad-header">
          <div className="ad-type" style={{ backgroundColor: getTypeColor() }}>
            {getTypeText()}
          </div>
          <div className="ad-rate">
            1 {ad.currency_from} = {ad.exchange_rate} {ad.currency_to}
          </div>
        </div>

        <div className="ad-body">
          <div className="ad-currencies">
            <span className="currency-from">{ad.currency_from}</span>
            <span className="arrow">→</span>
            <span className="currency-to">{ad.currency_to}</span>
          </div>

          <div className="ad-details">
            <div className="detail">
              <label>Available:</label>
              <span>{ad.amount_available} {ad.currency_from}</span>
            </div>
            <div className="detail">
              <label>Limits:</label>
              <span>{ad.min_amount} - {ad.max_amount} {ad.currency_from}</span>
            </div>
          </div>

          <div className="payment-methods">
            <label>Payment Methods:</label>
            <div className="methods-list">
              {ad.payment_methods.map((method, index) => (
                <span key={index} className="payment-method">{method}</span>
              ))}
            </div>
          </div>

          <div className="seller-info">
            <div className="seller-name">
              <span className="seller-label">Seller:</span>
              <span>{ad.seller_name}</span>
              {ad.seller_kyc_status === 'verified' && (
                <span className="kyc-badge">✅ KYC</span>
              )}
            </div>
          </div>
        </div>

        <div className="ad-footer">
          <button 
            className="trade-btn"
            onClick={() => handleStartTrade(ad)}
          >
            Start Trade
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading marketplace...</div>;
  }

  return (
    <div className="marketplace">
      <div className="marketplace-header">
        <h1>💰 P2P Marketplace</h1>
        <p>Trade currencies directly with other users</p>
        
        <div className="marketplace-actions">
          <div className="filter-buttons">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All Ads
            </button>
            <button 
              className={filter === 'buy' ? 'active' : ''}
              onClick={() => setFilter('buy')}
            >
              Want to Buy
            </button>
            <button 
              className={filter === 'sell' ? 'active' : ''}
              onClick={() => setFilter('sell')}
            >
              Want to Sell
            </button>
          </div>
          
          <button 
            className="create-ad-btn"
            onClick={() => setShowCreateModal(true)}
            disabled={false}
          >
            + Create New Ad
          </button>
        </div>
      </div>

      <div className="ads-grid">
        {filteredAds.length === 0 ? (
          <div className="no-ads">
            <h3>No ads found</h3>
            <p>Be the first to create a trading ad!</p>
          </div>
        ) : (
          filteredAds.map(ad => (
            <AdCard key={ad.id} ad={ad} />
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateAdModal 
          onClose={() => setShowCreateModal(false)}
          onAdCreated={handleAdCreated}
          user={user}
        />
      )}

{showOrderModal && selectedAd && (
  <OrderModal 
    ad={selectedAd}
    user={user} // Make sure this line exists
    onClose={() => {
      setShowOrderModal(false);
      setSelectedAd(null);
    }}
    onOrderCreated={handleOrderCreated}
  />
)}
    </div>
  );
};

export default Marketplace;
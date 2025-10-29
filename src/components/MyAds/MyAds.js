import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MyAds.css';

const MyAds = ({ user, onEditAd, onViewAd, onCreateAd }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({
    totalAds: 0,
    activeAds: 0,
    completedAds: 0,
    totalVolume: 0
  });

  useEffect(() => {
    if (user) {
      fetchUserAds();
    }
  }, [user]);

  useEffect(() => {
    calculateStats();
  }, [ads]);

  const fetchUserAds = async () => {
    try {
      setLoading(true);
      console.log('🟡 Fetching ads for user:', user.id);
      
      const response = await axios.get(`http://localhost:50000/api/ads/user/${user.id}`);
      console.log('📨 API Response:', response.data);
      
      setAds(response.data);
    } catch (error) {
      console.error('🔴 Error fetching ads:', error);
      if (error.response) {
        console.error('🔴 Server response:', error.response.data);
      }
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (ads.length === 0) {
      setStats({
        totalAds: 0,
        activeAds: 0,
        completedAds: 0,
        totalVolume: 0
      });
      return;
    }

    const totalAds = ads.length;
    const activeAds = ads.filter(ad => ad.status === 'active').length;
    const completedAds = ads.filter(ad => ad.status === 'completed').length;
    const totalVolume = ads.reduce((sum, ad) => sum + parseFloat(ad.total_trades || 0), 0);

    setStats({
      totalAds,
      activeAds,
      completedAds,
      totalVolume
    });
  };

  const handleEditAd = (adId) => {
    if (onEditAd) {
      onEditAd(adId);
    } else {
      console.log('Edit ad:', adId);
      alert('Edit functionality will be implemented soon!');
    }
  };

  const handlePauseAd = async (adId) => {
    try {
      await axios.patch(`http://localhost:50000/api/ads/${adId}`, {
        status: 'paused'
      });
      fetchUserAds();
    } catch (error) {
      console.error('Error pausing ad:', error);
      alert('Failed to pause ad');
    }
  };

  const handleActivateAd = async (adId) => {
    try {
      await axios.patch(`http://localhost:50000/api/ads/${adId}`, {
        status: 'active'
      });
      fetchUserAds();
    } catch (error) {
      console.error('Error activating ad:', error);
      alert('Failed to activate ad');
    }
  };

  const handleDeleteAd = async (adId) => {
    if (window.confirm('Are you sure you want to delete this ad? This action cannot be undone.')) {
      try {
        await axios.delete(`http://localhost:50000/api/ads/${adId}`);
        fetchUserAds();
      } catch (error) {
        console.error('Error deleting ad:', error);
        alert('Failed to delete ad');
      }
    }
  };

  const getFilteredAds = () => {
    switch (activeTab) {
      case 'active':
        return ads.filter(ad => ad.status === 'active');
      case 'paused':
        return ads.filter(ad => ad.status === 'paused');
      case 'completed':
        return ads.filter(ad => ad.status === 'completed');
      case 'all':
      default:
        return ads;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { class: 'status-active', text: 'Active' },
      paused: { class: 'status-paused', text: 'Paused' },
      completed: { class: 'status-completed', text: 'Completed' }
    };
    
    const config = statusConfig[status] || { class: 'status-default', text: status };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const getTradeTypeBadge = (type) => {
    return type === 'buy' 
      ? <span className="trade-type-badge buy">Buy</span>
      : <span className="trade-type-badge sell">Sell</span>;
  };

  if (loading) {
    return (
      <div className="my-ads-container">
        <div className="loading-spinner">Loading your ads...</div>
      </div>
    );
  }

  return (
    <div className="my-ads-container">
      <div className="my-ads-header">
        <h1>My Ads</h1>
        <button 
          className="create-ad-btn"
          onClick={onCreateAd}
        >
          + Create New Ad
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-value">{stats.totalAds}</div>
          <div className="stat-label">Total Ads</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.activeAds}</div>
          <div className="stat-label">Active Ads</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.completedAds}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalVolume}</div>
          <div className="stat-label">Total Trades</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="ads-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Ads ({ads.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active ({stats.activeAds})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'paused' ? 'active' : ''}`}
          onClick={() => setActiveTab('paused')}
        >
          Paused ({ads.filter(ad => ad.status === 'paused').length})
        </button>
      </div>

      {/* Ads List */}
      <div className="ads-list">
        {getFilteredAds().length === 0 ? (
          <div className="no-ads">
            <div className="no-ads-icon">📋</div>
            <h3>No ads found</h3>
            <p>You haven't created any ads yet or there are no ads matching the current filter.</p>
            <button 
              className="create-ad-btn"
              onClick={onCreateAd}
            >
              Create Your First Ad
            </button>
          </div>
        ) : (
          getFilteredAds().map(ad => (
            <div key={ad.id} className="ad-card">
              <div className="ad-header">
                <div className="ad-title-section">
                  <h3 className="ad-title">{ad.title}</h3>
                  <div className="ad-meta">
                    {getTradeTypeBadge(ad.trade_type)}
                    {getStatusBadge(ad.status)}
                    <span className="ad-date">
                      Created: {new Date(ad.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="ad-actions">
                  {ad.status === 'active' && (
                    <button 
                      className="action-btn pause"
                      onClick={() => handlePauseAd(ad.id)}
                      title="Pause Ad"
                    >
                      ⏸️ Pause
                    </button>
                  )}
                  {ad.status === 'paused' && (
                    <button 
                      className="action-btn activate"
                      onClick={() => handleActivateAd(ad.id)}
                      title="Activate Ad"
                    >
                      ▶️ Activate
                    </button>
                  )}
                  <button 
                    className="action-btn edit"
                    onClick={() => handleEditAd(ad.id)}
                    title="Edit Ad"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="action-btn delete"
                    onClick={() => handleDeleteAd(ad.id)}
                    title="Delete Ad"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              <div className="ad-details">
                <div className="detail-row">
                  <div className="detail-item">
                    <label>Asset</label>
                    <span className="detail-value">{ad.currency_from}/{ad.currency_to}</span>
                  </div>
                  <div className="detail-item">
                    <label>Price</label>
                    <span className="detail-value">{ad.price} {ad.currency_to}</span>
                  </div>
                  <div className="detail-item">
                    <label>Available</label>
                    <span className="detail-value">{ad.available_amount} {ad.currency_from}</span>
                  </div>
                  <div className="detail-item">
                    <label>Min/Max</label>
                    <span className="detail-value">
                      {ad.min_amount}-{ad.max_amount} {ad.currency_from}
                    </span>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-item">
                    <label>Payment Methods</label>
                    <span className="detail-value">
                      {ad.payment_methods ? JSON.parse(ad.payment_methods).join(', ') : 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Total Trades</label>
                    <span className="detail-value">{ad.total_trades || 0}</span>
                  </div>
                  <div className="detail-item">
                    <label>Success Rate</label>
                    <span className="detail-value">{ad.success_rate || 100}%</span>
                  </div>
                  <div className="detail-item">
                    <label>Response Time</label>
                    <span className="detail-value">{ad.response_time || 15} min</span>
                  </div>
                </div>
              </div>

              {ad.terms && (
                <div className="ad-terms">
                  <label>Terms & Conditions</label>
                  <p>{ad.terms}</p>
                </div>
              )}

              <div className="ad-footer">
                <div className="ad-performance">
                  <span className="performance-item">
                    👁️ {ad.views || 0} views
                  </span>
                  <span className="performance-item">
                    💬 {ad.inquiries || 0} inquiries
                  </span>
                  <span className="performance-item">
                    ✅ {ad.completed_trades || 0} completed
                  </span>
                </div>
                <button 
                  className="view-details-btn"
                  onClick={() => onViewAd && onViewAd(ad.id)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyAds;
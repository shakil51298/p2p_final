import React, { useState } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query'; // ✅ ADD THIS IMPORT
import EditAdModal from '../EditAdModal/EditAdModal';
import './MyAds.css';

const MyAds = ({ user, onCreateAd }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);

  // ✅ REPLACE useState/useEffect WITH REACT QUERY
  const { 
    data: ads = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['userAds', user.id],
    queryFn: async () => {
      const response = await axios.get(`http://localhost:50000/api/ads/user/${user.id}`);
      return response.data;
    },
    refetchInterval: 10000, // ✅ AUTO-REFRESH EVERY 10 SECONDS
    enabled: !!user, // ✅ ONLY FETCH IF USER EXISTS
  });

  // ✅ CALCULATE STATS FROM ADS DATA
  const calculateStats = () => {
    if (ads.length === 0) {
      return {
        totalAds: 0,
        activeAds: 0,
        pausedAds: 0,
        totalVolume: 0,
        totalViews: 0
      };
    }

    const totalAds = ads.length;
    const activeAds = ads.filter(ad => ad.status === 'active').length;
    const pausedAds = ads.filter(ad => ad.status === 'paused').length;
    const totalVolume = ads.reduce((sum, ad) => sum + parseFloat(ad.total_trades || 0), 0);
    const totalViews = ads.reduce((sum, ad) => sum + parseInt(ad.views || 0), 0);

    return { totalAds, activeAds, pausedAds, totalVolume, totalViews };
  };

  const stats = calculateStats();

  // ✅ AD MANAGEMENT FUNCTIONS
  const handleEditAd = (ad) => {
    setSelectedAd(ad);
    setShowEditModal(true);
  };

  const handleAdUpdated = () => {
    refetch(); // ✅ REFRESH DATA AFTER EDIT
  };

  const handlePauseAd = async (adId) => {
    try {
      await axios.post(`http://localhost:50000/api/ads/${adId}/pause`);
      alert('Ad paused successfully! It will be hidden from the marketplace.');
      refetch(); // ✅ REFRESH DATA AFTER PAUSE
    } catch (error) {
      console.error('🔴 Error pausing ad:', error);
      alert('Failed to pause ad. Please try again.');
    }
  };

  const handleResumeAd = async (adId) => {
    try {
      await axios.post(`http://localhost:50000/api/ads/${adId}/resume`);
      alert('Ad resumed successfully! It is now visible in the marketplace.');
      refetch(); // ✅ REFRESH DATA AFTER RESUME
    } catch (error) {
      console.error('🔴 Error resuming ad:', error);
      alert('Failed to resume ad. Please try again.');
    }
  };

  const handleDeleteAd = async (adId) => {
    if (window.confirm('Are you sure you want to delete this ad? This action cannot be undone.')) {
      try {
        await axios.delete(`http://localhost:50000/api/ads/${adId}`);
        alert('Ad deleted successfully!');
        refetch(); // ✅ REFRESH DATA AFTER DELETE
      } catch (error) {
        console.error('🔴 Error deleting ad:', error);
        alert('Failed to delete ad. Please try again.');
      }
    }
  };

  // ✅ HELPER FUNCTIONS
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

  const formatViews = (views) => {
    if (!views) return '0';
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    }
    if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  };

  // ✅ LOADING STATE
  if (isLoading) {
    return (
      <div className="my-ads-container">
        <div className="loading-spinner">Loading your ads...</div>
      </div>
    );
  }

  // ✅ ERROR STATE
  if (error) {
    return (
      <div className="my-ads-container">
        <div className="error-message">
          <h3>Error loading ads</h3>
          <p>Failed to load your ads. Please try again.</p>
          <button onClick={refetch} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ✅ MAIN COMPONENT RENDER
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
          <div className="stat-value">{stats.pausedAds}</div>
          <div className="stat-label">Paused Ads</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatViews(stats.totalViews)}</div>
          <div className="stat-label">Total Views</div>
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
          Paused ({stats.pausedAds})
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
                  {/* Pause/Resume based on current status */}
                  {ad.status === 'active' ? (
                    <button 
                      className="action-btn pause"
                      onClick={() => handlePauseAd(ad.id)}
                      title="Pause Ad - Hide from marketplace"
                    >
                      ⏸️ Pause
                    </button>
                  ) : ad.status === 'paused' ? (
                    <button 
                      className="action-btn resume"
                      onClick={() => handleResumeAd(ad.id)}
                      title="Resume Ad - Show in marketplace"
                    >
                      ▶️ Resume
                    </button>
                  ) : null}
                  
                  <button 
                    className="action-btn edit"
                    onClick={() => handleEditAd(ad)}
                    title="Edit Ad Details"
                  >
                    ✏️ Edit
                  </button>
                  
                  <button 
                    className="action-btn delete"
                    onClick={() => handleDeleteAd(ad.id)}
                    title="Delete Ad Permanently"
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
                  <span className="performance-item views-count" title={`${ad.views || 0} people viewed this ad`}>
                    👁️ {formatViews(ad.views || 0)} views
                  </span>
                  <span className="performance-item">
                    💬 {ad.inquiries || 0} inquiries
                  </span>
                  <span className="performance-item">
                    ✅ {ad.completed_trades || 0} completed trades
                  </span>
                </div>
                <div className="ad-status-info">
                  <span className="marketplace-status">
                    {ad.status === 'active' ? '🟢 Visible in Marketplace' : '🔴 Hidden from Marketplace'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Ad Modal */}
      {showEditModal && selectedAd && (
        <EditAdModal
          ad={selectedAd}
          user={user}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAd(null);
          }}
          onAdUpdated={handleAdUpdated}
        />
      )}
    </div>
  );
};

export default MyAds;
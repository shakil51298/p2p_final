import React, { useEffect, useState } from 'react';
import Marketplace from './Marketplace';
import OrdersPage from './OrdersPage';
import MyAds from './MyAds/MyAds';
import NotificationBell from './NotificationBell/NotificationBell';
import { useNotifications } from '../App';
import io from 'socket.io-client';


const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { addNotification } = useNotifications();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize Socket.io connection
    const newSocket = io('http://localhost:50000');
    setSocket(newSocket);

    // Listen for notifications
    newSocket.on('new_order', (orderData) => {
      console.log('New Order Received:', orderData);

      //show notification;
      addNotification({
        type: 'order',
        title: 'New Order Received!',
        message: `Someone placed an order on your ad: ${orderData.ad_title}`,
        orderId: orderData.id
      });
    });

    // Join user's personal room for notifications
    newSocket.emit('join_user', user.id);

    return () => {
      newSocket.disconnect();
    };
  }, [user.id, addNotification]);

  const renderContent = () => {
    switch (activeTab) {
      case 'marketplace':
        return <Marketplace user={user} />;
        case 'myads':
          case 'myads':
            case 'myads':
              return (
                <MyAds 
                  user={user} 
                  onCreateAd={() => setActiveTab('marketplace')} // Navigate to marketplace to create ad
                  onEditAd={(adId) => {
                    // Handle edit ad - you can implement this later
                    console.log('Edit ad:', adId);
                    alert('Edit ad functionality coming soon!');
                  }}
                  onViewAd={(adId) => {
                    // Handle view ad details
                    console.log('View ad:', adId);
                    alert('View ad details functionality coming soon!');
                  }}
                />
              );
      case 'orders': // Add this case
        return <OrdersPage user={user} />;
      case 'dashboard':
      default:
        return (
          <div className="dashboard-content">
            <div className="welcome-card">
              <h2>Hello, {user.name}! 👋</h2>
              <p>Welcome to your P2P Exchange dashboard. Start trading currencies with people worldwide.</p>
            </div>

            <div className="status-card">
              <h3>Account Status</h3>
              <div className="status-item">
                <span>Email Verified:</span>
                <span className="status-badge verified">✅ Verified</span>
              </div>
              <div className="status-item">
                <span>KYC Status:</span>
                <span className="status-badge verified">
                  ✅ Verified (Development Mode)
                </span>
              </div>
              <div className="status-item">
                <span>User ID:</span>
                <span className="user-id">#{user.id}</span>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button 
                  className="action-btn primary" 
                  onClick={() => setActiveTab('marketplace')}
                >
                  🔍 Browse Marketplace
                </button>
                <button 
                  className="action-btn primary"
                  onClick={() => setActiveTab('marketplace')}
                >
                  💰 Create New Ad
                </button>
                <button className="action-btn info">
                  ⚙️ Account Settings
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🎯 P2P Exchange</h1>
          
          <nav className="dashboard-nav">
            <button 
              className={activeTab === 'dashboard' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={activeTab === 'marketplace' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setActiveTab('marketplace')}
            >
              Marketplace
            </button>
            <button 
                className={activeTab === 'myads' ? 'nav-btn active' : 'nav-btn'}
                onClick={() => setActiveTab('myads')}
              >
                My Ads
              </button>
            <button 
              className={activeTab === 'orders' ? 'nav-btn active' : 'nav-btn'} // Add this
              onClick={() => setActiveTab('orders')}
            >
              Orders
            </button>
          </nav>

          <div className="user-info">
          <NotificationBell />
            <span>Welcome, <strong>{user.name}</strong>!</span>
            <button onClick={onLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../App';
import './NotificationBell.css';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, addNotification } = useNotifications();
  const dropdownRef = useRef(null);

   // Test notification sound
   const testNotificationSound = () => {
    addNotification({
      type: 'test',
      title: '🔊 Sound Test',
      message: 'Testing notification sound system',
      priority: 'low'
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Test function to simulate notifications (you can remove this later)
  const testNotification = () => {
    addNotification({
      type: 'new_order',
      title: '🎉 Test Notification',
      message: 'This is a test notification from the system',
      priority: 'medium'
    });
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order':
        return '🛒';
      case 'order_status':
        return '📦';
      case 'new_message':
        return '💬';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  const getNotificationPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className="notification-bell" 
        onClick={toggleDropdown}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Test button - remove in production */}
      {<button 
        onClick={testNotification}
        style={{
          marginLeft: '10px',
          padding: '5px 10px',
          fontSize: '12px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test Notify
      </button> }

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications ({notifications.length})</h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button className="mark-all-btn" onClick={markAllAsRead}>
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button className="clear-all-btn" onClick={clearAll}>
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <div className="empty-icon">🔔</div>
                <p>No notifications yet</p>
                <small>You'll see real-time alerts here for new orders and messages</small>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'} ${getNotificationPriorityClass(notification.priority)}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                      {notification.priority === 'high' && <span className="urgent-badge">URGENT</span>}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-meta">
                      <span className="notification-time">
                        {formatTime(notification.timestamp)}
                      </span>
                      {notification.data && notification.data.order_id && (
                        <span className="order-id">
                          Order #{notification.data.order_id}
                        </span>
                      )}
                    </div>
                  </div>
                  {!notification.read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <small>Real-time updates enabled ✅</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
import React, { useState, useEffect, createContext, useContext } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import './App.css';

// ✅ CREATE NOTIFICATION CONTEXT
const NotificationContext = createContext();

// ✅ CUSTOM HOOK FOR NOTIFICATIONS
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// ✅ NOTIFICATION PROVIDER COMPONENT
const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:50000'); // Your server URL
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // ✅ IMPROVED NOTIFICATION SOUND FUNCTION
  const playNotificationSound = () => {
    // Method 1: Try to play MP3 file
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.3; // Set volume to 30%
      audio.play().catch(err => {
        console.log('MP3 audio play failed, trying fallback:', err);
        // If MP3 fails, use browser-generated sound
        playBrowserSound();
      });
    } catch (error) {
      console.log('MP3 audio error, using fallback:', error);
      playBrowserSound();
    }
  };

  // ✅ BROWSER-GENERATED SOUND (FALLBACK - NO FILE NEEDED)
  const playBrowserSound = () => {
    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      
      // Create oscillator for beep sound
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      // Configure the beep sound
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // Frequency in Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime); // Volume
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
      
    } catch (error) {
      console.log('Browser sound also failed:', error);
    }
  };

  // ✅ VIBRATION (FOR MOBILE DEVICES)
  const vibrateDevice = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(200); // Vibrate for 200ms
    }
  };

  // Add new notification
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      ...notification,
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // ✅ PLAY SOUND AND VIBRATE
    playNotificationSound();
    vibrateDevice();
    
    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification(notification.title || 'New Notification', {
        body: notification.message,
        icon: '/favicon.ico',
        tag: 'p2p-notification'
      });
    }
  };

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Join user notification room
  const joinUserRoom = (userId) => {
    if (socket && userId) {
      socket.emit('join_user', userId);
      console.log(`🔔 Frontend: Joined notification room for user ${userId}`);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      socket,
      joinUserRoom
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

// ✅ CREATE QUERY CLIENT
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// ✅ MAIN APP COMPONENT (without useNotifications hook)
function AppContent() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Now we can use the hook here because this component is INSIDE NotificationProvider
  const { joinUserRoom, socket, addNotification } = useNotifications();

  // Request notification permission on app start
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('Notification permission:', permission);
        });
      }
    }
  }, []);

  // Check if user is already logged in (on app start)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  // Socket.io listeners for real-time notifications
  useEffect(() => {
    if (socket && currentUser) {
      // Join user's notification room when logged in
      joinUserRoom(currentUser.id);

      // Listen for new orders
      socket.on('new_order', (orderData) => {
        console.log('🔔 New order received:', orderData);
        
        addNotification({
          type: 'new_order',
          title: '🎉 New Order Received!',
          message: `New order for: ${orderData.ad_title || 'Your Ad'}`,
          data: orderData,
          priority: 'high'
        });
      });

      // Listen for order status updates
      socket.on('order_status_updated', (statusData) => {
        console.log('🔔 Order status updated:', statusData);
        
        addNotification({
          type: 'order_status',
          title: '📦 Order Status Updated',
          message: `Order #${statusData.order_id} is now ${statusData.status}`,
          data: statusData,
          priority: 'medium'
        });
      });

      // Listen for chat messages (if you want notifications for new messages)
      socket.on('receive_message', (messageData) => {
        console.log('🔔 New message received:', messageData);
        
        // Only notify if message is not from current user
        if (messageData.sender_id !== currentUser.id) {
          addNotification({
            type: 'new_message',
            title: '💬 New Message',
            message: `New message in order #${messageData.order_id}`,
            data: messageData,
            priority: 'low'
          });
        }
      });

      // Handle connection events
      socket.on('connect', () => {
        console.log('🔵 Connected to server');
      });

      socket.on('disconnect', () => {
        console.log('🔴 Disconnected from server');
      });

      socket.on('connect_error', (error) => {
        console.error('🔴 Connection error:', error);
      });
    }

    // Cleanup on unmount or when user/socket changes
    return () => {
      if (socket) {
        socket.off('new_order');
        socket.off('order_status_updated');
        socket.off('receive_message');
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
      }
    };
  }, [socket, currentUser, joinUserRoom, addNotification]);

  const handleLogin = (authData) => {
    setCurrentUser(authData.user);
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(authData.user));
    console.log('User logged in:', authData.user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    queryClient.clear();
    console.log('User logged out');
  };

  if (loading) {
    return (
      <div className="app">
        <div className="container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {currentUser ? (
        <Dashboard user={currentUser} onLogout={handleLogout} />
      ) : (
        <div className="container">
          <div className="auth-container">
            <div className="auth-header">
              <h1>🚀 P2P Currency Exchange</h1>
              <p>Trade currencies securely with people worldwide</p>
            </div>

            {showLogin ? (
              <>
                <Login onLogin={handleLogin} />
                <div className="auth-switch">
                  <p>Don't have an account?{' '}
                    <span className="switch-link" onClick={() => setShowLogin(false)}>
                      Sign up here
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <>
                <Register onLogin={handleLogin} />
                <div className="auth-switch">
                  <p>Already have an account?{' '}
                    <span className="switch-link" onClick={() => setShowLogin(true)}>
                      Login here
                    </span>
                  </p>
                </div>
              </>
            )}

            <div className="features">
              <h3>Why Choose Our Platform?</h3>
              <div className="feature-list">
                <div className="feature">🔒 Secure Transactions</div>
                <div className="feature">🌍 Global Marketplace</div>
                <div className="feature">⚡ Fast Verification</div>
                <div className="feature">💼 Multiple Payment Methods</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ MAIN APP WRAPPER
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;
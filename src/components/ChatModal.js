import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const ChatModal = ({ order, user, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connectionError, setConnectionError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:50000', {
      transports: ['websocket', 'polling'] // Enable both transports
    });

    newSocket.on('connect', () => {
      console.log('🔵 Socket connected:', newSocket.id);
      setConnectionError('');
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error);
      setConnectionError('Failed to connect to chat server');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason);
    });

    setSocket(newSocket);

    // Load chat messages
    loadMessages();

    // Join order room after connection is established
    if (newSocket.connected) {
      joinOrderRoom(newSocket);
    } else {
      newSocket.on('connect', () => {
        joinOrderRoom(newSocket);
      });
    }

    // Listen for new messages
    newSocket.on('receive_message', (message) => {
      console.log('💬 New message received:', message);
      setMessages(prev => [...prev, message]);
    });

    // Listen for typing indicators
    newSocket.on('user_typing', (data) => {
      console.log('⌨️ User typing:', data);
      setTypingUsers(prev => {
        if (!prev.find(user => user.userId === data.userId)) {
          return [...prev, data];
        }
        return prev;
      });
    });

    newSocket.on('user_stop_typing', (data) => {
      console.log('⌨️ User stopped typing:', data);
      setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
    });

    return () => {
      console.log('🔴 Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, [order.id]);

  const joinOrderRoom = (socket) => {
    console.log('🟡 Joining order room:', order.id);
    socket.emit('join_order', order.id);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const loadMessages = async () => {
    try {
      console.log('🟡 Loading messages for order:', order.id);
      const response = await axios.get(`http://localhost:50000/api/chat/messages/${order.id}`);
      console.log('📨 Loaded messages:', response.data);
      setMessages(response.data);
    } catch (error) {
      console.error('🔴 Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) {
      console.log('🔴 Cannot send message - no socket or empty message');
      return;
    }

    if (!socket.connected) {
      setConnectionError('Not connected to chat server. Please try again.');
      return;
    }

    const messageData = {
      orderId: order.id,
      senderId: user.id,
      senderName: user.name,
      message: newMessage.trim(),
      messageType: 'text'
    };

    console.log('📤 Sending message:', messageData);
    socket.emit('send_message', messageData);
    setNewMessage('');
  };

  const handleTyping = () => {
    if (socket && socket.connected) {
      socket.emit('typing', {
        orderId: order.id,
        userId: user.id,
        userName: user.name
      });

      // Stop typing after 1 second
      setTimeout(() => {
        if (socket && socket.connected) {
          socket.emit('stop_typing', {
            orderId: order.id,
            userId: user.id
          });
        }
      }, 1000);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isMyMessage = (message) => {
    return message.sender_id === user.id;
  };

  const getOtherPartyName = () => {
    if (user.id === order.buyer_id) {
      return order.seller_name;
    } else {
      return order.buyer_name;
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading">Loading chat...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content chat-modal">
        <div className="chat-header">
          <div className="chat-title">
            <h3>💬 Trade Chat - Order #{order.id}</h3>
            <div className="order-info">
              Chatting with: {getOtherPartyName()}
            </div>
            <div className="debug-info">
              <small>Your ID: {user.id} | Order ID: {order.id} | Socket: {socket?.connected ? '🟢 Connected' : '🔴 Disconnected'}</small>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {connectionError && (
          <div className="error-message">
            {connectionError}
          </div>
        )}

        <div className="chat-order-details">
          <div className="trade-summary">
            <span>{order.amount} {order.currency_from}</span>
            <span className="arrow">→</span>
            <span>{order.total_price} {order.currency_to}</span>
          </div>
          <div className="order-status">
            Status: <span className={`status-${order.status}`}>{order.status}</span>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="no-messages">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`message ${isMyMessage(message) ? 'my-message' : 'other-message'}`}
              >
                <div className="message-content">
                  <div className="message-text">{message.message}</div>
                  <div className="message-time">
                    {formatTime(message.created_at)}
                    {!isMyMessage(message) && (
                      <span className="sender-name"> • {message.sender_name}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {typingUsers.length > 0 && (
            <div className="typing-indicator">
              {typingUsers.map(user => (
                <div key={user.userId} className="typing-text">
                  {user.userName} is typing...
                </div>
              ))}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="chat-input-form">
          <div className="input-group">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type your message..."
              maxLength="500"
              disabled={!socket?.connected}
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim() || !socket?.connected}
            >
              {socket?.connected ? 'Send' : 'Connecting...'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
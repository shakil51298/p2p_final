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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:50000', {
      transports: ['websocket', 'polling']
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
      
      // Parse file_data from JSON string
      const messagesWithFiles = response.data.map(message => ({
        ...message,
        file_data: message.file_data ? JSON.parse(message.file_data) : null
      }));
      
      setMessages(messagesWithFiles);
    } catch (error) {
      console.error('🔴 Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('📤 Uploading file:', file.name);
      
      const uploadResponse = await axios.post('http://localhost:50000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('🟢 File uploaded:', uploadResponse.data);

      // Send file message via socket
      if (socket && socket.connected) {
        const messageData = {
          orderId: order.id,
          senderId: user.id,
          senderName: user.name,
          message: file.name,
          messageType: 'file',
          file: uploadResponse.data.file
        };

        console.log('📤 Sending file message:', messageData);
        socket.emit('send_message', messageData);
      }

    } catch (error) {
      console.error('🔴 File upload error:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset file input
    e.target.value = '';
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

  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype === 'application/pdf') return '📄';
    if (mimetype.includes('word') || mimetype.includes('document')) return '📝';
    if (mimetype === 'text/plain') return '📃';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                  {message.message_type === 'file' && message.file_data ? (
                    <div className="file-message">
                      <div className="file-info">
                        <span className="file-icon">
                          {getFileIcon(message.file_data.mimetype)}
                        </span>
                        <div className="file-details">
                          <div className="file-name">{message.file_data.originalname}</div>
                          <div className="file-size">{formatFileSize(message.file_data.size)}</div>
                        </div>
                      </div>
                      <a 
                        href={`http://localhost:50000${message.file_data.path}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="download-btn"
                      >
                        Download
                      </a>
                    </div>
                  ) : (
                    <div className="message-text">{message.message}</div>
                  )}
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
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
              style={{ display: 'none' }}
            />
            
            <button 
              type="button" 
              className="file-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !socket?.connected}
            >
              {uploading ? '📤 Uploading...' : '📎'}
            </button>
            
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type your message or attach file..."
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
          
          <div className="file-types-info">
            <small>Supported: Images (JPG, PNG, GIF), PDF, DOC, DOCX, TXT (Max 10MB)</small>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
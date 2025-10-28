import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import ReactCrop from 'react-image-crop';
import Modal from 'react-modal';
import 'react-image-crop/dist/ReactCrop.css';

// Set app element for accessibility
Modal.setAppElement('#root');

const ChatModal = ({ order, user, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connectionError, setConnectionError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [crop, setCrop] = useState({ unit: '%', width: 100, height: 100 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imageRef, setImageRef] = useState(null);
  const [fileCaption, setFileCaption] = useState('');
  const [blurIntensity, setBlurIntensity] = useState(20);

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
      
      // Parse file_data from JSON string with error handling
      const messagesWithFiles = response.data.map(message => {
        try {
          return {
            ...message,
            file_data: message.file_data ? JSON.parse(message.file_data) : null
          };
        } catch (error) {
          console.error('🔴 Error parsing file_data for message:', message.id, error);
          return {
            ...message,
            file_data: null
          };
        }
      });
      
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input
    e.target.value = '';
  };

  const getCroppedImg = (image, crop, fileName) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio;

    canvas.width = crop.width * pixelRatio * scaleX;
    canvas.height = crop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Canvas is empty');
            return;
          }
          blob.name = fileName;
          resolve(blob);
        },
        selectedFile.type,
        1
      );
    });
  };

  const handleCropComplete = async () => {
    if (imageRef && completedCrop && selectedFile && selectedFile.type.startsWith('image/')) {
      try {
        const croppedImageBlob = await getCroppedImg(
          imageRef,
          completedCrop,
          selectedFile.name
        );
        const croppedFile = new File([croppedImageBlob], selectedFile.name, { type: selectedFile.type });
        setSelectedFile(croppedFile);
        
        // Create new preview from cropped image
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target.result);
        };
        reader.readAsDataURL(croppedFile);
      } catch (error) {
        console.error('Error cropping image:', error);
      }
    }
    setCropModalOpen(false);
  };

  const applyBlurEffect = () => {
    if (!filePreview) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Apply blur
      ctx.filter = `blur(${blurIntensity}px)`;
      ctx.drawImage(img, 0, 0);
      
      // Convert back to file
      canvas.toBlob((blob) => {
        const blurredFile = new File([blob], `blurred-${selectedFile.name}`, { type: selectedFile.type });
        setSelectedFile(blurredFile);
        setFilePreview(canvas.toDataURL());
      }, selectedFile.type);
    };
    
    img.src = filePreview;
  };

  const handleSendFile = async () => {
    if (!selectedFile || !socket) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log('📤 Uploading file:', selectedFile.name);
      
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
          message: fileCaption || selectedFile.name,
          messageType: 'file',
          file: uploadResponse.data.file
        };

        console.log('📤 Sending file message:', messageData);
        socket.emit('send_message', messageData);
        
        // Reset file state
        setSelectedFile(null);
        setFilePreview(null);
        setFileCaption('');
        setEditModalOpen(false);
      }

    } catch (error) {
      console.error('🔴 File upload error:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const cancelFileSend = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileCaption('');
    setCropModalOpen(false);
    setEditModalOpen(false);
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
    if (!mimetype) return '📎';
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype === 'application/pdf') return '📄';
    if (mimetype.includes('word') || mimetype.includes('document')) return '📝';
    if (mimetype === 'text/plain') return '📃';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Safe function to check if message has file data
  const hasFileData = (message) => {
    return message && message.message_type === 'file' && message.file_data;
  };

  // Safe function to get file mimetype
  const getFileMimetype = (message) => {
    return hasFileData(message) ? message.file_data.mimetype : null;
  };

  // Safe function to get file original name
  const getFileName = (message) => {
    return hasFileData(message) ? message.file_data.originalname : '';
  };

  // Safe function to get file size
  const getFileSize = (message) => {
    return hasFileData(message) ? message.file_data.size : 0;
  };

  // Safe function to get file path
  const getFilePath = (message) => {
    return hasFileData(message) ? message.file_data.path : '';
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
                  {hasFileData(message) ? (
                    <div className="file-message">
                      <div className="file-info">
                        <span className="file-icon">
                          {getFileIcon(getFileMimetype(message))}
                        </span>
                        <div className="file-details">
                          <div className="file-name">{getFileName(message)}</div>
                          <div className="file-size">{formatFileSize(getFileSize(message))}</div>
                          {message.message && message.message !== getFileName(message) && (
                            <div className="file-caption">{message.message}</div>
                          )}
                        </div>
                      </div>
                      {getFileMimetype(message) && getFileMimetype(message).startsWith('image/') ? (
                        <div className="image-preview-container">
                          <img 
                            src={`http://localhost:50000${getFilePath(message)}`}
                            alt={getFileName(message)}
                            className="image-preview blurred"
                            onLoad={(e) => {
                              // Remove blur after image loads
                              setTimeout(() => {
                                e.target.classList.remove('blurred');
                              }, 1000);
                            }}
                            onError={(e) => {
                              console.error('🔴 Error loading image:', getFilePath(message));
                              e.target.style.display = 'none';
                            }}
                          />
                          <a 
                            href={`http://localhost:50000${getFilePath(message)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="download-btn"
                          >
                            View Original
                          </a>
                        </div>
                      ) : (
                        <a 
                          href={`http://localhost:50000${getFilePath(message)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="download-btn"
                        >
                          Download
                        </a>
                      )}
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

        {/* File Preview Section */}
        {selectedFile && !cropModalOpen && !editModalOpen && (
          <div className="file-preview-section">
            <div className="file-preview-header">
              <h4>📎 File Preview</h4>
              <button className="cancel-file-btn" onClick={cancelFileSend}>×</button>
            </div>
            <div className="file-preview-content">
              {selectedFile.type.startsWith('image/') ? (
                <img src={filePreview} alt="Preview" className="file-preview-image" />
              ) : (
                <div className="file-preview-generic">
                  <span className="file-icon-large">{getFileIcon(selectedFile.type)}</span>
                  <div className="file-details">
                    <div className="file-name">{selectedFile.name}</div>
                    <div className="file-size">{formatFileSize(selectedFile.size)}</div>
                  </div>
                </div>
              )}
              <div className="file-caption-input">
                <input
                  type="text"
                  value={fileCaption}
                  onChange={(e) => setFileCaption(e.target.value)}
                  placeholder="Add a caption (optional)"
                  maxLength="200"
                />
              </div>
              <div className="file-actions">
                <button 
                  className="edit-btn"
                  onClick={() => setEditModalOpen(true)}
                  disabled={!selectedFile.type.startsWith('image/')}
                >
                  🎨 Edit
                </button>
                <button 
                  className="cancel-btn" 
                  onClick={cancelFileSend}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  className="send-file-btn" 
                  onClick={handleSendFile}
                  disabled={uploading}
                >
                  {uploading ? '📤 Sending...' : '📤 Send File'}
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={sendMessage} className="chat-input-form">
          <div className="input-group">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
              style={{ display: 'none' }}
            />
            
            <div className="file-buttons">
              <button 
                type="button" 
                className="file-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !socket?.connected || selectedFile}
                title="Upload File"
              >
                📎
              </button>
            </div>
            
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type your message..."
              maxLength="500"
              disabled={!socket?.connected || selectedFile}
            />
            
            <button 
              type="submit" 
              disabled={!newMessage.trim() || !socket?.connected || selectedFile}
            >
              {socket?.connected ? 'Send' : 'Connecting...'}
            </button>
          </div>
          
          <div className="file-types-info">
            <small>Supported: Images (JPG, PNG, GIF), PDF, DOC, DOCX, TXT (Max 10MB)</small>
          </div>
        </form>

        {/* Crop Modal */}
        <Modal
          isOpen={cropModalOpen}
          onRequestClose={cancelFileSend}
          className="crop-modal"
          overlayClassName="crop-modal-overlay"
        >
          <div className="crop-modal-content">
            <div className="crop-modal-header">
              <h3>✂️ Crop Image</h3>
              <button className="close-btn" onClick={cancelFileSend}>×</button>
            </div>
            <div className="crop-area">
              {selectedFile?.type.startsWith('image/') ? (
                <ReactCrop
                  crop={crop}
                  onChange={(newCrop) => setCrop(newCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                >
                  <img
                    ref={setImageRef}
                    src={filePreview}
                    alt="Crop preview"
                    onLoad={(e) => {
                      const { width, height } = e.currentTarget;
                      setCrop({
                        unit: '%',
                        width: 90,
                        height: (90 * height) / width,
                      });
                    }}
                  />
                </ReactCrop>
              ) : (
                <div className="file-preview-generic">
                  <span className="file-icon-large">{getFileIcon(selectedFile?.type)}</span>
                  <div className="file-details">
                    <div className="file-name">{selectedFile?.name}</div>
                    <div className="file-size">{formatFileSize(selectedFile?.size)}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="crop-actions">
              <button className="cancel-btn" onClick={cancelFileSend}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleCropComplete}>
                {selectedFile?.type.startsWith('image/') ? 'Apply Crop' : 'Continue'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Simple Edit Modal */}
        <Modal
          isOpen={editModalOpen}
          onRequestClose={cancelFileSend}
          className="edit-modal"
          overlayClassName="edit-modal-overlay"
        >
          <div className="edit-modal-content">
            <div className="edit-modal-header">
              <h3>🎨 Edit Image</h3>
              <button className="close-btn" onClick={cancelFileSend}>×</button>
            </div>
            
            <div className="edit-tools">
              <div className="tool-section">
                <h4>Effects</h4>
                <div className="effect-buttons">
                  <button className="effect-btn" onClick={applyBlurEffect}>
                    🔍 Apply Blur
                  </button>
                  <label>
                    Blur Intensity:
                    <input 
                      type="range" 
                      min="1" 
                      max="50" 
                      value={blurIntensity} 
                      onChange={(e) => setBlurIntensity(parseInt(e.target.value))}
                    />
                    <span>{blurIntensity}px</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="edit-preview-container">
              <img src={filePreview} alt="Edit preview" className="edit-preview-image" />
            </div>

            <div className="edit-actions">
              <button className="cancel-btn" onClick={cancelFileSend}>
                Cancel
              </button>
              <button className="save-btn" onClick={() => setEditModalOpen(false)}>
                💾 Done Editing
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ChatModal;
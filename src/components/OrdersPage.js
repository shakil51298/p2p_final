import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChatModal from './ChatModal';

const OrdersPage = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchOrders();
    // Refresh orders every 30 seconds to update timers
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      console.log('🟡 Fetching orders for user:', user.id);
      const response = await axios.get(`http://localhost:50000/api/orders/my-orders?user_id=${user.id}`);
      console.log('📦 Orders loaded:', response.data);
      setOrders(response.data);
    } catch (error) {
      console.error('🔴 Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      paid: '#17a2b8', 
      completed: '#28a745',
      disputed: '#dc3545',
      cancelled: '#6c757d'
    };
    return colors[status] || '#6c757d';
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Time expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const handleViewChat = (order) => {
    console.log('🟡 Opening chat for order:', order.id);
    setSelectedOrder(order);
    setShowChatModal(true);
  };

  const handleMarkAsPaid = async (order) => {
    setActionLoading(order.id);
    try {
      console.log('🟡 Marking order as paid:', order.id);
      
      const response = await axios.put(`http://localhost:50000/api/orders/${order.id}/status`, {
        status: 'paid',
        user_id: user.id
      });

      console.log('🟢 Order marked as paid:', response.data);
      
      // Refresh orders to show updated status
      await fetchOrders();
      
      alert('Order marked as paid! Please send your receiving account details to the seller in chat.');
      
    } catch (error) {
      console.error('🔴 Error marking order as paid:', error);
      alert(error.response?.data?.message || 'Error marking order as paid');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestBankAccount = async (order) => {
    setActionLoading(`request-bank-${order.id}`);
    try {
      console.log('🟡 Requesting bank account for order:', order.id);
      
      const response = await axios.post(`http://localhost:50000/api/orders/${order.id}/request-bank`, {
        requested_by: user.id
      });

      console.log('🟢 Bank account request sent:', response.data);
      
      alert('Bank account request sent to seller! They will provide details in chat.');
      
    } catch (error) {
      console.error('🔴 Error requesting bank account:', error);
      alert(error.response?.data?.message || 'Error requesting bank account');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmBankSent = async (order) => {
    setActionLoading(`confirm-bank-${order.id}`);
    try {
      console.log('🟡 Confirming bank account sent for order:', order.id);
      
      const response = await axios.post(`http://localhost:50000/api/orders/${order.id}/confirm-bank-sent`, {
        confirmed_by: user.id
      });

      console.log('🟢 Bank account sent confirmation:', response.data);
      
      alert('Buyer notified that bank account details have been provided!');
      
    } catch (error) {
      console.error('🔴 Error confirming bank account sent:', error);
      alert(error.response?.data?.message || 'Error confirming bank account sent');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmAccountSent = async (order) => {
    setActionLoading(`confirm-account-${order.id}`);
    try {
      console.log('🟡 Confirming account details sent for order:', order.id);
      
      const response = await axios.post(`http://localhost:50000/api/orders/${order.id}/confirm-account-sent`, {
        sent_by: user.id
      });

      console.log('🟢 Account details sent confirmation:', response.data);
      
      alert('Seller notified! Timer started for seller to complete payment.');
      
      // Refresh orders to show updated timer
      await fetchOrders();
      
    } catch (error) {
      console.error('🔴 Error confirming account details sent:', error);
      alert(error.response?.data?.message || 'Error confirming account details sent');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setActionLoading(`cancel-${order.id}`);
    try {
      console.log('🟡 Cancelling order:', order.id);
      
      const response = await axios.post(`http://localhost:50000/api/orders/${order.id}/cancel`, {
        cancelled_by: user.id,
        reason: 'User cancelled'
      });

      console.log('🟢 Order cancelled:', response.data);
      
      // Refresh orders to show updated status
      await fetchOrders();
      
      alert('Order cancelled successfully!');
      
    } catch (error) {
      console.error('🔴 Error cancelling order:', error);
      alert(error.response?.data?.message || 'Error cancelling order');
    } finally {
      setActionLoading(null);
    }
  };

  const isBuyer = (order) => user.id === order.buyer_id;
  const isSeller = (order) => user.id === order.seller_id;

  const getOrderActions = (order) => {
    const actions = [];
    const userIsBuyer = isBuyer(order);
    const userIsSeller = isSeller(order);

    if (order.status === 'pending') {
      if (userIsBuyer) {
        // Buyer actions for pending order
        actions.push(
          <button 
            key="request-bank"
            className="action-btn primary"
            onClick={() => handleRequestBankAccount(order)}
            disabled={actionLoading === `request-bank-${order.id}`}
          >
            {actionLoading === `request-bank-${order.id}` ? 'Sending...' : '🏦 Request Bank Account'}
          </button>
        );
        
        actions.push(
          <button 
            key="mark-paid"
            className="action-btn success"
            onClick={() => handleMarkAsPaid(order)}
            disabled={actionLoading === order.id}
          >
            {actionLoading === order.id ? 'Processing...' : '✅ Mark as Paid'}
          </button>
        );
      }

      if (userIsSeller) {
        // Seller actions for pending order
        actions.push(
          <button 
            key="confirm-bank"
            className="action-btn info"
            onClick={() => handleConfirmBankSent(order)}
            disabled={actionLoading === `confirm-bank-${order.id}`}
          >
            {actionLoading === `confirm-bank-${order.id}` ? 'Sending...' : '📨 Already Sent Bank Account'}
          </button>
        );
      }

      // Both can cancel pending orders
      actions.push(
        <button 
          key="cancel"
          className="action-btn danger"
          onClick={() => handleCancelOrder(order)}
          disabled={actionLoading === `cancel-${order.id}`}
        >
          {actionLoading === `cancel-${order.id}` ? 'Cancelling...' : '❌ Cancel Order'}
        </button>
      );
    }

    if (order.status === 'paid') {
      if (userIsBuyer) {
        // Buyer actions after marking as paid
        actions.push(
          <button 
            key="confirm-account"
            className="action-btn warning"
            onClick={() => handleConfirmAccountSent(order)}
            disabled={actionLoading === `confirm-account-${order.id}`}
          >
            {actionLoading === `confirm-account-${order.id}` ? 'Sending...' : '📤 Account Already Sent'}
          </button>
        );
      }

      if (userIsSeller) {
        // Seller actions when order is paid
        actions.push(
          <button 
            key="mark-completed"
            className="action-btn success"
            onClick={() => handleMarkAsPaid(order)} // Reusing mark as paid for seller completion
            disabled={actionLoading === order.id}
          >
            {actionLoading === order.id ? 'Processing...' : '✅ Mark as Paid (Complete)'}
          </button>
        );
      }
    }

    // Chat button always available
    actions.push(
      <button 
        key="chat"
        className="action-btn info"
        onClick={() => handleViewChat(order)}
      >
        💬 View Chat
      </button>
    );

    return actions;
  };

  const getOrderInstructions = (order) => {
    const userIsBuyer = isBuyer(order);
    const userIsSeller = isSeller(order);

    if (order.status === 'pending') {
      if (userIsBuyer) {
        return (
          <div className="order-instructions info">
            <strong>Next Steps:</strong> 
            <ol>
              <li>Click "Request Bank Account" to ask seller for payment details</li>
              <li>Check chat for seller's bank account information</li>
              <li>Make payment to seller's account</li>
              <li>Click "Mark as Paid" after payment</li>
              <li>Send your receiving account details in chat</li>
              <li>Click "Account Already Sent" to start seller's timer</li>
            </ol>
          </div>
        );
      }
      if (userIsSeller) {
        return (
          <div className="order-instructions info">
            <strong>Next Steps:</strong> 
            <ol>
              <li>Wait for buyer to request your bank account</li>
              <li>Provide your bank account details in chat</li>
              <li>Click "Already Sent Bank Account" to notify buyer</li>
              <li>Wait for buyer to make payment</li>
            </ol>
          </div>
        );
      }
    }

    if (order.status === 'paid') {
      if (userIsBuyer) {
        return (
          <div className="order-instructions warning">
            <strong>Next Steps:</strong> 
            <ol>
              <li>Send your receiving account details in chat</li>
              <li>Click "Account Already Sent" to start seller's payment timer</li>
              <li>Wait for seller to complete their payment</li>
            </ol>
            {order.countdown_end && (
              <div className="timer-warning">
                ⏰ Seller has until {formatTime(order.countdown_end)} to complete payment
              </div>
            )}
          </div>
        );
      }
      if (userIsSeller) {
        return (
          <div className="order-instructions warning">
            <strong>Next Steps:</strong> 
            <ol>
              <li>Check chat for buyer's receiving account details</li>
              <li>Make payment to buyer's account</li>
              <li>Click "Mark as Paid" to complete the order</li>
            </ol>
            {order.countdown_end && (
              <div className="timer-info">
                ⏰ Time remaining: {getTimeRemaining(order.countdown_end)}
              </div>
            )}
          </div>
        );
      }
    }

    if (order.status === 'completed') {
      return (
        <div className="order-instructions success">
          <strong>✅ Order Completed!</strong> Trade successfully completed.
        </div>
      );
    }

    if (order.status === 'cancelled') {
      return (
        <div className="order-instructions danger">
          <strong>❌ Order Cancelled</strong> This order has been cancelled.
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1>📦 My Orders</h1>
        <p>Manage your trade orders and track their status</p>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <h3>No orders yet</h3>
          <p>Start trading by creating or responding to ads in the marketplace!</p>
          <button className="primary-btn">
            Go to Marketplace
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-id">Order #{order.id}</div>
                <div 
                  className="order-status"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {order.status.toUpperCase()}
                </div>
              </div>

              <div className="order-body">
                <div className="order-pair">
                  <span className="currency">{order.currency_from}</span>
                  <span className="arrow">→</span>
                  <span className="currency">{order.currency_to}</span>
                </div>

                <div className="order-details">
                  <div className="detail">
                    <label>Amount:</label>
                    <span>{order.amount} {order.currency_from}</span>
                  </div>
                  <div className="detail">
                    <label>Total:</label>
                    <span>{order.total_price} {order.currency_to}</span>
                  </div>
                  <div className="detail">
                    <label>Rate:</label>
                    <span>1 {order.currency_from} = {order.exchange_rate} {order.currency_to}</span>
                  </div>
                  <div className="detail">
                    <label>Created:</label>
                    <span>{formatTime(order.created_at)}</span>
                  </div>
                  {order.countdown_end && order.status === 'paid' && (
                    <div className="detail">
                      <label>Time Left:</label>
                      <span className="countdown">
                        {getTimeRemaining(order.countdown_end)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="order-parties">
                  <div className="party">
                    <strong>Buyer:</strong> {order.buyer_name} (ID: {order.buyer_id})
                  </div>
                  <div className="party">
                    <strong>Seller:</strong> {order.seller_name} (ID: {order.seller_id})
                  </div>
                  <div className="party">
                    <strong>Your Role:</strong> {isBuyer(order) ? 'Buyer' : 'Seller'}
                  </div>
                </div>

                {/* Order Instructions */}
                {getOrderInstructions(order)}
              </div>

              <div className="order-actions">
                {getOrderActions(order)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && selectedOrder && (
        <ChatModal 
          order={selectedOrder}
          user={user}
          onClose={() => {
            console.log('🔴 Closing chat modal');
            setShowChatModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default OrdersPage;
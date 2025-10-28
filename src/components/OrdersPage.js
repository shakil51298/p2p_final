import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChatModal from './ChatModal';

const OrdersPage = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`http://localhost:50000/api/orders/my-orders?user_id=${user.id}`);
      console.log('📦 Orders loaded for user:', user.id, response.data);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
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
                  {order.countdown_end && (
                    <div className="detail">
                      <label>Time Left:</label>
                      <span className="countdown">
                        {formatTime(order.countdown_end)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="order-parties">
                  <div className="party">
                    <strong>Buyer:</strong> {order.buyer_name}
                  </div>
                  <div className="party">
                    <strong>Seller:</strong> {order.seller_name}
                  </div>
                </div>
              </div>

              <div className="order-actions">
                {order.status === 'pending' && (
                  <>
                    <button className="action-btn success">Mark as Paid</button>
                    <button className="action-btn danger">Cancel Order</button>
                  </>
                )}
                {order.status === 'paid' && (
                  <button className="action-btn success">Release Funds</button>
                )}
                <button 
  className="action-btn info"
  onClick={() => {
    setSelectedOrder(order);
    setShowChatModal(true);
  }}
>
  View Chat
</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showChatModal && selectedOrder && (
  <ChatModal 
    order={selectedOrder}
    user={user}
    onClose={() => {
      setShowChatModal(false);
      setSelectedOrder(null);
    }}
  />
)}
    </div>
  );
};

export default OrdersPage;
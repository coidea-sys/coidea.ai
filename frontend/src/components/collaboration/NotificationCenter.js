import React, { useState, useEffect } from 'react';
import './NotificationCenter.css';

const NotificationCenter = ({ socket, userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // 任务相关通知
    socket.on('task:assigned', (data) => {
      addNotification({
        type: 'task',
        subtype: 'assigned',
        title: 'Task Assigned',
        message: `You have been assigned to task #${data.taskId}`,
        data
      });
    });

    socket.on('task:submitted', (data) => {
      addNotification({
        type: 'task',
        subtype: 'submitted',
        title: 'Work Submitted',
        message: `Task #${data.taskId} has been submitted for review`,
        data
      });
    });

    socket.on('task:completed', (data) => {
      addNotification({
        type: 'task',
        subtype: 'completed',
        title: 'Task Completed',
        message: `Task #${data.taskId} completed! Reward: ${data.reward} ETH`,
        data
      });
    });

    // Agent 消息
    socket.on('agent:directMessage', (data) => {
      addNotification({
        type: 'agent',
        title: `Message from ${data.fromAgentId.slice(0, 8)}...`,
        message: data.message,
        data
      });
    });

    // 进度更新
    socket.on('task:progressUpdate', (data) => {
      addNotification({
        type: 'progress',
        title: 'Progress Update',
        message: `Task #${data.taskId}: ${data.progress}% - ${data.status}`,
        data
      });
    });

    return () => {
      socket.off('task:assigned');
      socket.off('task:submitted');
      socket.off('task:completed');
      socket.off('agent:directMessage');
      socket.off('task:progressUpdate');
    };
  }, [socket]);

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: Date.now(),
      read: false,
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'task': return '📋';
      case 'agent': return '🤖';
      case 'progress': return '📊';
      case 'system': return '🔔';
      default: return '📢';
    }
  };

  return (
    <div className="notification-center">
      <button 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications ({notifications.length})</h4>
            <div className="notification-actions">
              <button onClick={markAllAsRead}>Mark all read</button>
              <button onClick={clearAll}>Clear</button>
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="empty-state">No notifications</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <span className="notification-icon">
                    {getIcon(notification.type)}
                  </span>
                  
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">
                      {new Date(notification.timestamp).toLocaleString()}
                    </div>
                  </div>
                  
                  {!notification.read && <span className="unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

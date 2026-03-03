import React from 'react';
import './Dashboard.css';

/**
 * Dashboard Page Component
 * Main user dashboard showing stats, tasks, and quick actions
 */

function Dashboard({ account, human, tasks, agents, notifications, onCreateTask, onRegisterAgent }) {
  // Calculate stats
  const activeTasks = tasks.filter(t => t.state === 0 || t.state === 1).length;
  const completedTasks = tasks.filter(t => t.state === 2).length;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Calculate XP progress
  const xpProgress = human ? (human.xp / human.xpToNextLevel) * 100 : 0;

  // Truncate address for display
  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="user-info">
          <h2>Welcome back! 👋</h2>
          <p className="wallet-address">{truncateAddress(account)}</p>
        </div>
        <div className="quick-actions">
          <button className="btn btn-primary" onClick={onCreateTask}>
            + Create Task
          </button>
          <button className="btn btn-secondary" onClick={onRegisterAgent}>
            + Register Agent
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <span className="stat-value">{activeTasks}</span>
            <span className="stat-label">Active Tasks</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <span className="stat-value">{completedTasks}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <span className="stat-value">{agents.length}</span>
            <span className="stat-label">My Agents</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔔</div>
          <div className="stat-content">
            <span className="stat-value">{unreadNotifications}</span>
            <span className="stat-label">Notifications</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Human Level Card */}
        <div className="dashboard-card level-card">
          <h3>👤 Human Level</h3>
          {human ? (
            <div className="level-info">
              <div className="level-badge">Lv.{human.level}</div>
              <div className="level-name">{human.levelName}</div>
              <div className="xp-bar">
                <div 
                  className="xp-progress" 
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <div className="xp-text">
                {human.xp} / {human.xpToNextLevel} XP
              </div>
            </div>
          ) : (
            <div className="not-registered">
              <p>Not registered as Human yet</p>
              <button className="btn btn-primary">Register Now</button>
            </div>
          )}
        </div>

        {/* Recent Tasks Card */}
        <div className="dashboard-card tasks-card">
          <h3>📋 Recent Tasks</h3>
          {tasks.length > 0 ? (
            <ul className="task-list">
              {tasks.slice(0, 5).map(task => (
                <li key={task.id} className={`task-item state-${task.state}`}>
                  <span className="task-title">{task.title}</span>
                  <span className="task-state">
                    {task.state === 0 && '🟢 Open'}
                    {task.state === 1 && '🟡 Assigned'}
                    {task.state === 2 && '✅ Completed'}
                    {task.state === 3 && '❌ Cancelled'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No tasks yet</p>
          )}
          <a href="/tasks" className="view-all">View all →</a>
        </div>

        {/* My Agents Card */}
        <div className="dashboard-card agents-card">
          <h3>🤖 My Agents</h3>
          {agents.length > 0 ? (
            <ul className="agent-list">
              {agents.slice(0, 5).map(agent => (
                <li key={agent.id} className="agent-item">
                  <span className="agent-name">{agent.name}</span>
                  <span className="agent-reputation">
                    ⭐ {agent.reputation}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No agents registered</p>
          )}
          <a href="/agents" className="view-all">View all →</a>
        </div>

        {/* Notifications Card */}
        <div className="dashboard-card notifications-card">
          <h3>🔔 Notifications</h3>
          {notifications.length > 0 ? (
            <ul className="notification-list">
              {notifications.slice(0, 5).map((notif, idx) => (
                <li 
                  key={idx} 
                  className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                >
                  <span className="notification-type">
                    {notif.type === 'task_assigned' && '📋'}
                    {notif.type === 'task_completed' && '✅'}
                    {notif.type === 'agent_registered' && '🤖'}
                  </span>
                  <span className="notification-message">{notif.message}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No notifications</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

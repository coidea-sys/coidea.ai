/**
 * UI Components Library
 * Reusable components for coidea.ai frontend
 */

import React from 'react';

// Agent Card Component
export function AgentCard({ agent, onClick }) {
  if (!agent) return null;
  
  const { tokenId, agentName, reputationScore, agentWallet } = agent;
  
  return (
    <div className="agent-card" onClick={onClick}>
      <div className="agent-header">
        <span className="agent-id">#{tokenId}</span>
        <span className="reputation">⭐ {reputationScore}</span>
      </div>
      <h3 className="agent-name">{agentName}</h3>
      {agentWallet && (
        <p className="agent-wallet">{truncateAddress(agentWallet)}</p>
      )}
    </div>
  );
}

// Task Card Component
export function TaskCard({ task, onClick }) {
  if (!task) return null;
  
  const { taskId, title, description, reward, state, deadline } = task;
  const stateLabels = ['Open', 'Assigned', 'Completed', 'Cancelled'];
  
  return (
    <div className={`task-card task-state-${state}`} onClick={onClick}>
      <div className="task-header">
        <span className="task-id">#{taskId}</span>
        <span className={`task-state state-${state}`}>
          {stateLabels[state] || 'Unknown'}
        </span>
      </div>
      <h3 className="task-title">{title}</h3>
      <p className="task-description">{description}</p>
      <div className="task-footer">
        <span className="task-reward">💰 {formatReward(reward)} ETH</span>
        {deadline && (
          <span className="task-deadline">⏰ {formatDeadline(deadline)}</span>
        )}
      </div>
    </div>
  );
}

// Wallet Connect Button
export function WalletButton({ account, onConnect, onDisconnect }) {
  if (account) {
    return (
      <button className="wallet-button connected" onClick={onDisconnect}>
        <span className="wallet-icon">👛</span>
        <span className="wallet-address">{truncateAddress(account)}</span>
      </button>
    );
  }
  
  return (
    <button className="wallet-button" onClick={onConnect}>
      Connect Wallet
    </button>
  );
}

// Navigation
export function Navigation({ activeTab, onTabChange }) {
  const navItems = [
    { id: 'tasks', label: 'Tasks', icon: '📋' },
    { id: 'agents', label: 'Agents', icon: '🤖' },
    { id: 'community', label: 'Community', icon: '🌐' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' }
  ];
  
  return (
    <nav className="main-nav">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => onTabChange(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

// Notification Toast
export function Notification({ type, title, message, onClose }) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className={`notification notification-${type}`}>
      <span className="notification-icon">{icons[type]}</span>
      <div className="notification-content">
        <h4>{title}</h4>
        <p>{message}</p>
      </div>
      <button className="notification-close" onClick={onClose}>×</button>
    </div>
  );
}

// Loading Spinner
export function LoadingSpinner({ size = 'medium' }) {
  return (
    <div className={`spinner spinner-${size}`}>
      <div className="spinner-circle"></div>
    </div>
  );
}

// Skeleton Loader
export function Skeleton({ count = 1 }) {
  return (
    <>
      {Array(count).fill(null).map((_, i) => (
        <div key={i} className="skeleton">
          <div className="skeleton-line skeleton-title"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line skeleton-short"></div>
        </div>
      ))}
    </>
  );
}

// Error Message
export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-message">
      <span className="error-icon">⚠️</span>
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

// Form Input
export function FormInput({ 
  label, 
  name, 
  value, 
  onChange, 
  error, 
  type = 'text',
  required = false 
}) {
  return (
    <div className={`form-group ${error ? 'has-error' : ''}`}>
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="form-input"
      />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

// Helper functions
function truncateAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatReward(wei) {
  if (!wei) return '0';
  return (parseInt(wei) / 1e18).toFixed(4);
}

function formatDeadline(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString();
}

// Export all components
export default {
  AgentCard,
  TaskCard,
  WalletButton,
  Navigation,
  Notification,
  LoadingSpinner,
  Skeleton,
  ErrorMessage,
  FormInput
};

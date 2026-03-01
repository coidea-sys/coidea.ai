import React from 'react';
import { ethers } from 'ethers';

const LIABILITY_ICONS = {
  'Standard': '📄',
  'Limited': '🛡️',
  'Insured': '🔒',
  'Bonded': '⚖️'
};

const LIABILITY_COLORS = {
  'Standard': '#4CAF50',
  'Limited': '#2196F3',
  'Insured': '#9C27B0',
  'Bonded': '#FF9800'
};

function TaskCard({ task }) {
  const getStateColor = (state) => {
    const colors = {
      'Draft': '#6b7280',
      'Open': '#00d4ff',
      'Assigned': '#f59e0b',
      'Submitted': '#8b5cf6',
      'Completed': '#10b981',
      'Cancelled': '#ef4444',
      'Disputed': '#f97316'
    };
    return colors[state] || '#6b7280';
  };

  const formatReward = (reward) => {
    if (!reward) return '0 POL';
    if (typeof reward === 'string' && reward.startsWith('0x')) {
      const eth = parseFloat(ethers.formatEther(reward));
      return `${eth.toFixed(4)} POL`;
    }
    if (typeof reward === 'bigint') {
      return `${parseFloat(ethers.formatEther(reward)).toFixed(4)} POL`;
    }
    return `${parseFloat(reward).toFixed(4)} POL`;
  };

  const formatAddress = (addr) => {
    if (!addr) return 'Unknown';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const liabilityModel = task.liabilityModel || 'Standard';
  const liabilityIcon = LIABILITY_ICONS[liabilityModel] || '📄';
  const liabilityColor = LIABILITY_COLORS[liabilityModel] || '#4CAF50';

  return (
    <div className="task-card">
      <div className="task-header">
        <h3>{task.title || 'Untitled Task'}</h3>
        <div className="task-badges">
          <span 
            className="state-badge"
            style={{ backgroundColor: getStateColor(task.state) }}
          >
            {task.state || 'Draft'}
          </span>
          <span 
            className="liability-badge"
            style={{ 
              backgroundColor: `${liabilityColor}20`,
              color: liabilityColor,
              border: `1px solid ${liabilityColor}`
            }}
            title={`Liability Model: ${liabilityModel}`}
          >
            {liabilityIcon} {liabilityModel}
          </span>
        </div>
      </div>
      
      <p className="task-description">{task.description || 'No description'}</p>
      
      <div className="task-meta">
        <div className="meta-item">
          <span className="meta-label">💰 Reward</span>
          <span className="meta-value">{formatReward(task.reward)}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">👤 Publisher</span>
          <span className="meta-value">{formatAddress(task.publisher)}</span>
        </div>
        {task.worker && (
          <div className="meta-item">
            <span className="meta-label">🔨 Worker</span>
            <span className="meta-value">{formatAddress(task.worker)}</span>
          </div>
        )}
      </div>
      
      <div className="task-actions">
        {task.state === 'Open' && (
          <button className="btn btn-primary">Apply</button>
        )}
        {task.state === 'Assigned' && (
          <button className="btn btn-secondary">Submit Work</button>
        )}
        <button className="btn btn-small">View Details</button>
      </div>
    </div>
  );
}

export default TaskCard;

import React from 'react';

function TaskCard({ task }) {
  const getStateColor = (state) => {
    const colors = {
      0: '#6b7280', // Draft
      1: '#00d4ff', // Open
      2: '#f59e0b', // Assigned
      3: '#8b5cf6', // Submitted
      4: '#10b981', // Completed
      5: '#ef4444', // Cancelled
      6: '#f97316'  // Disputed
    };
    return colors[state] || '#6b7280';
  };

  const getStateName = (state) => {
    const names = ['Draft', 'Open', 'Assigned', 'Submitted', 'Completed', 'Cancelled', 'Disputed'];
    return names[state] || 'Unknown';
  };

  const formatReward = (reward) => {
    if (!reward) return '0 POL';
    const eth = parseFloat(reward) / 1e18;
    return `${eth.toFixed(4)} POL`;
  };

  return (
    <div className="task-card">
      <div className="task-header">
        <h3>{task.title || 'Untitled Task'}</h3>
        <span 
          className="state-badge"
          style={{ backgroundColor: getStateColor(task.state) }}
        >
          {getStateName(task.state)}
        </span>
      </div>
      
      <p className="task-description">{task.description || 'No description'}</p>
      
      <div className="task-meta">
        <div className="meta-item">
          <span className="meta-label">💰 Reward</span>
          <span className="meta-value">{formatReward(task.reward)}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">👤 Publisher</span>
          <span className="meta-value">{task.publisher ? `${task.publisher.slice(0, 6)}...${task.publisher.slice(-4)}` : 'Unknown'}</span>
        </div>
      </div>
      
      <div className="task-actions">
        {task.state === 1 && ( // Open
          <button className="btn btn-primary">Apply</button>
        )}
        {task.state === 2 && ( // Assigned
          <button className="btn btn-secondary">Submit Work</button>
        )}
        <button className="btn btn-small">View Details</button>
      </div>
    </div>
  );
}

export default TaskCard;

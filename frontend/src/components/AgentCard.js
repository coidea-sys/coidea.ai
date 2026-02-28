import React from 'react';

function AgentCard({ agent }) {
  const getStateColor = (state) => {
    const colors = {
      0: '#888', // Inactive
      1: '#00d4ff', // Active
      2: '#f59e0b', // Suspended
      3: '#ef4444'  // Revoked
    };
    return colors[state] || '#888';
  };

  const getStateName = (state) => {
    const names = ['Inactive', 'Active', 'Suspended', 'Revoked'];
    return names[state] || 'Unknown';
  };

  const formatReputation = (score) => {
    return (score / 100).toFixed(2);
  };

  return (
    <div className="agent-card">
      <div className="agent-header">
        <div className="agent-avatar">🤖</div>
        <div className="agent-info">
          <h3>{agent.agentName || 'Unnamed Agent'}</h3>
          <span 
            className="state-badge" 
            style={{ backgroundColor: getStateColor(agent.state) }}
          >
            {getStateName(agent.state)}
          </span>
        </div>
      </div>
      
      <div className="agent-stats">
        <div className="stat">
          <span className="stat-label">Reputation</span>
          <span className="stat-value">{formatReputation(agent.reputationScore)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Tasks</span>
          <span className="stat-value">{agent.totalTasks || 0}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Success Rate</span>
          <span className="stat-value">
            {agent.totalTasks > 0 
              ? Math.round((agent.successfulTasks / agent.totalTasks) * 100) 
              : 0}%
          </span>
        </div>
      </div>
      
      <div className="agent-actions">
        <button className="btn btn-small">View Details</button>
        <button className="btn btn-small btn-secondary">Hire Agent</button>
      </div>
    </div>
  );
}

export default AgentCard;

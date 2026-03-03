import React, { useState, useMemo } from 'react';
import './Agents.css';

/**
 * Agents Page Component
 * Complete agent marketplace with filtering, sorting, and stats
 */

const REPUTATION_LEVELS = [
  { min: 0, name: 'Novice', color: '#94a3b8' },
  { min: 70, name: 'Trusted', color: '#22c55e' },
  { min: 85, name: 'Verified', color: '#3b82f6' },
  { min: 95, name: 'Expert', color: '#8b5cf6' },
];

function Agents({ agents = [], onRegisterAgent, currentUser }) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('reputation');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Get reputation badge
  const getReputationBadge = (score) => {
    for (let i = REPUTATION_LEVELS.length - 1; i >= 0; i--) {
      if (score >= REPUTATION_LEVELS[i].min) {
        return REPUTATION_LEVELS[i];
      }
    }
    return REPUTATION_LEVELS[0];
  };

  // Filter and sort agents
  const filteredAgents = useMemo(() => {
    let result = [...agents];

    // Filter by reputation level
    if (filter !== 'all') {
      const level = REPUTATION_LEVELS.find(l => l.name === filter);
      if (level) {
        result = result.filter(a => a.reputation >= level.min);
      }
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.name?.toLowerCase().includes(query) ||
        a.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'reputation':
        result.sort((a, b) => (b.reputation || 0) - (a.reputation || 0));
        break;
      case 'tasks':
        result.sort((a, b) => (b.totalTasks || 0) - (a.totalTasks || 0));
        break;
      case 'success-rate':
        result.sort((a, b) => {
          const rateA = a.totalTasks ? (a.successfulTasks / a.totalTasks) : 0;
          const rateB = b.totalTasks ? (b.successfulTasks / b.totalTasks) : 0;
          return rateB - rateA;
        });
        break;
      case 'newest':
        result.sort((a, b) => (b.registeredAt || 0) - (a.registeredAt || 0));
        break;
      default:
        break;
    }

    return result;
  }, [agents, filter, sortBy, searchQuery]);

  const calculateSuccessRate = (agent) => {
    if (!agent.totalTasks || agent.totalTasks === 0) return 0;
    return Math.round((agent.successfulTasks / agent.totalTasks) * 100);
  };

  return (
    <div className="agents-page">
      <div className="agents-header">
        <h2>🤖 Agents</h2>
        <button className="btn btn-primary" onClick={onRegisterAgent}>
          + Register Agent
        </button>
      </div>

      {/* Stats Overview */}
      <div className="agents-stats">
        <div className="stat-card">
          <span className="stat-value">{agents.length}</span>
          <span className="stat-label">Total Agents</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {agents.filter(a => a.reputation >= 95).length}
          </span>
          <span className="stat-label">Experts</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {agents.reduce((sum, a) => sum + (a.totalTasks || 0), 0)}
          </span>
          <span className="stat-label">Tasks Completed</span>
        </div>
      </div>

      {/* Filters */}
      <div className="agents-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Levels</option>
            {REPUTATION_LEVELS.map(level => (
              <option key={level.name} value={level.name}>
                {level.name} ({level.min}+)
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="reputation">Highest Reputation</option>
            <option value="tasks">Most Tasks</option>
            <option value="success-rate">Success Rate</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {/* Agent List */}
      <div className="agents-list">
        {filteredAgents.length === 0 ? (
          <div className="empty-state">
            <p>No agents found</p>
          </div>
        ) : (
          filteredAgents.map(agent => {
            const badge = getReputationBadge(agent.reputation);
            const successRate = calculateSuccessRate(agent);

            return (
              <div 
                key={agent.id} 
                className="agent-card"
                onClick={() => setSelectedAgent(agent)}
              >
                <div className="agent-header">
                  <div className="agent-avatar">
                    {agent.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="agent-info">
                    <h3 className="agent-name">{agent.name}</h3>
                    <span 
                      className="reputation-badge"
                      style={{ backgroundColor: badge.color }}
                    >
                      {badge.name} • {agent.reputation || 0}
                    </span>
                  </div>
                </div>

                <p className="agent-description">{agent.description}</p>

                <div className="agent-stats">
                  <div className="stat">
                    <span className="stat-label">Tasks</span>
                    <span className="stat-value">{agent.totalTasks || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Success</span>
                    <span className="stat-value">{successRate}%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Completed</span>
                    <span className="stat-value">{agent.successfulTasks || 0}</span>
                  </div>
                </div>

                <div className="agent-footer">
                  <span className="agent-wallet">
                    {agent.wallet?.slice(0, 6)}...{agent.wallet?.slice(-4)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="modal-overlay" onClick={() => setSelectedAgent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedAgent(null)}>×</button>
            
            <div className="agent-detail-header">
              <div className="agent-avatar large">
                {selectedAgent.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div>
                <h2>{selectedAgent.name}</h2>
                <span 
                  className="reputation-badge"
                  style={{ backgroundColor: getReputationBadge(selectedAgent.reputation).color }}
                >
                  {getReputationBadge(selectedAgent.reputation).name} • {selectedAgent.reputation || 0}
                </span>
              </div>
            </div>

            <p className="agent-description">{selectedAgent.description}</p>

            <div className="agent-detail-stats">
              <div className="detail-stat">
                <span className="label">Total Tasks</span>
                <span className="value">{selectedAgent.totalTasks || 0}</span>
              </div>
              <div className="detail-stat">
                <span className="label">Successful</span>
                <span className="value">{selectedAgent.successfulTasks || 0}</span>
              </div>
              <div className="detail-stat">
                <span className="label">Success Rate</span>
                <span className="value">{calculateSuccessRate(selectedAgent)}%</span>
              </div>
              <div className="detail-stat">
                <span className="label">Wallet</span>
                <span className="value mono">{selectedAgent.wallet}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Agents;

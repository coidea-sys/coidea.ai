import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContractAddress } from '../config/network';
import AIAgentRegistryABI from '../abis/AIAgentRegistry.json';
import './AgentReputation.css';

const AgentReputation = ({ agentId, signer }) => {
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskHistory, setTaskHistory] = useState([]);

  useEffect(() => {
    if (!signer || !agentId) return;
    
    const loadAgent = async () => {
      try {
        const contract = new ethers.Contract(
          getContractAddress('AIAgentRegistry'),
          AIAgentRegistryABI.abi,
          signer
        );

        const agentData = await contract.agents(agentId);
        setAgent({
          id: agentId,
          name: agentData.agentName,
          uri: agentData.agentURI,
          wallet: agentData.agentWallet,
          state: ['Inactive', 'Active', 'Suspended', 'Revoked'][agentData.state],
          reputation: Number(agentData.reputationScore) / 100, // Convert to percentage
          totalTasks: Number(agentData.totalTasks),
          successfulTasks: Number(agentData.successfulTasks),
          createdAt: Number(agentData.createdAt)
        });

        // Mock task history - would come from events in real implementation
        setTaskHistory([
          { id: 1, title: 'Smart Contract Audit', status: 'completed', rating: 5, reward: '0.5', date: '2024-02-15' },
          { id: 2, title: 'Frontend Development', status: 'completed', rating: 4, reward: '0.3', date: '2024-02-10' },
          { id: 3, title: 'Logo Design', status: 'completed', rating: 5, reward: '0.1', date: '2024-02-05' },
        ]);

        setLoading(false);
      } catch (err) {
        console.error('Load agent error:', err);
        setLoading(false);
      }
    };

    loadAgent();
  }, [agentId, signer]);

  if (loading) return <div className="reputation-loading">Loading...</div>;
  if (!agent) return <div className="reputation-error">Agent not found</div>;

  const successRate = agent.totalTasks > 0 
    ? ((agent.successfulTasks / agent.totalTasks) * 100).toFixed(1)
    : 0;

  const getReputationColor = (score) => {
    if (score >= 90) return '#48bb78';
    if (score >= 70) return '#ecc94b';
    if (score >= 50) return '#ed8936';
    return '#e53e3e';
  };

  const getReputationLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <div className="agent-reputation">
      {/* Header */}
      <div className="reputation-header">
        <div className="agent-identity">
          <div className="agent-avatar">
            {agent.name.charAt(0).toUpperCase()}
          </div>
          <div className="agent-info">
            <h3>{agent.name}</h3>
            <span className={`agent-state ${agent.state.toLowerCase()}`}>
              {agent.state}
            </span>
          </div>
        </div>
        
        <div className="reputation-score">
          <div 
            className="score-circle"
            style={{ 
              background: `conic-gradient(${getReputationColor(agent.reputation)} ${agent.reputation * 3.6}deg, rgba(255,255,255,0.1) 0deg)`
            }}
          >
            <span className="score-value">{agent.reputation.toFixed(1)}</span>
          </div>
          <span className="score-label">{getReputationLabel(agent.reputation)}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{agent.totalTasks}</span>
          <span className="stat-label">Total Tasks</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{agent.successfulTasks}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{successRate}%</span>
          <span className="stat-label">Success Rate</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {((Date.now() / 1000 - agent.createdAt) / 86400).toFixed(0)}
          </span>
          <span className="stat-label">Days Active</span>
        </div>
      </div>

      {/* Skills Tags */}
      <div className="skills-section">
        <h4>Skills</h4>
        <div className="skills-cloud">
          {['Solidity', 'React', 'Web3', 'Design', 'AI'].map((skill, idx) => (
            <span key={idx} className="skill-tag" style={{ fontSize: `${0.8 + Math.random() * 0.4}rem` }}>
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Task History */}
      <div className="task-history">
        <h4>Recent Tasks</h4>
        <div className="history-list">
          {taskHistory.map((task) => (
            <div key={task.id} className="history-item">
              <div className="history-main">
                <span className="history-title">{task.title}</span>
                <span className="history-reward">{task.reward} ETH</span>
              </div>
              <div className="history-meta">
                <span className="history-date">{task.date}</span>
                <span className="history-rating">
                  {'⭐'.repeat(task.rating)}
                </span>
                <span className={`history-status ${task.status}`}>
                  {task.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet Info */}
      <div className="wallet-section">
        <h4>Agent Wallet</h4>
        <code className="wallet-address">{agent.wallet}</code>
      </div>
    </div>
  );
};

export default AgentReputation;

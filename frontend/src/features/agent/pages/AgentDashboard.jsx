import React, { useState } from 'react';
import { CreateAgentForm } from '../components/CreateAgentForm';
import { AgentList } from '../components/AgentList';

export function AgentDashboard({ account }) {
  const [activeTab, setActiveTab] = useState('list');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = () => {
    setActiveTab('list');
    setRefreshKey(prev => prev + 1);
  };

  if (!account) {
    return (
      <div data-testid="connect-prompt">
        <h2>请连接钱包</h2>
        <p>连接 MetaMask 以管理你的 Agents</p>
      </div>
    );
  }

  return (
    <div data-testid="agent-dashboard">
      <h2>Agent 控制台</h2>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('list')}
          style={{ fontWeight: activeTab === 'list' ? 'bold' : 'normal' }}
        >
          我的 Agents
        </button>
        <button 
          onClick={() => setActiveTab('create')}
          style={{ fontWeight: activeTab === 'create' ? 'bold' : 'normal' }}
        >
          创建 Agent
        </button>
      </div>

      {activeTab === 'list' && (
        <AgentList 
          key={refreshKey}
          ownerAddress={account} 
        />
      )}

      {activeTab === 'create' && (
        <CreateAgentForm onSuccess={handleCreateSuccess} />
      )}
    </div>
  );
}

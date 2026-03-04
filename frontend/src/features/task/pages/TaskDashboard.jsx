import React, { useState } from 'react';
import { CreateTaskForm } from '../components/CreateTaskForm';
import { TaskList } from '../components/TaskList';

export function TaskDashboard({ account }) {
  const [activeTab, setActiveTab] = useState('browse');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = () => {
    setActiveTab('browse');
    setRefreshKey(prev => prev + 1);
  };

  if (!account) {
    return (
      <div data-testid="connect-prompt">
        <h2>请连接钱包</h2>
        <p>连接 MetaMask 以浏览和发布任务</p>
      </div>
    );
  }

  return (
    <div data-testid="task-dashboard">
      <h2>任务市场</h2>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('browse')}
          style={{ fontWeight: activeTab === 'browse' ? 'bold' : 'normal' }}
        >
          浏览任务
        </button>
        <button 
          onClick={() => setActiveTab('create')}
          style={{ fontWeight: activeTab === 'create' ? 'bold' : 'normal' }}
        >
          发布任务
        </button>
      </div>

      {activeTab === 'browse' && (
        <TaskList key={refreshKey} filter="open" />
      )}

      {activeTab === 'create' && (
        <CreateTaskForm onSuccess={handleCreateSuccess} />
      )}
    </div>
  );
}

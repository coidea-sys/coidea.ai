import React, { useState, useEffect } from 'react';
import { useAgent } from '../hooks/useAgent';

export function AgentList({ ownerAddress, onSelectAgent }) {
  const { getMyAgents, isLoading, error } = useAgent();
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    if (ownerAddress) {
      loadAgents();
    }
  }, [ownerAddress]);

  const loadAgents = async () => {
    const data = await getMyAgents(ownerAddress);
    setAgents(data);
  };

  if (isLoading) {
    return (<div data-testid="agent-list-loading">加载中...</div>);
  }

  if (error) {
    return (<div data-testid="agent-list-error" style={{ color: 'red' }}>{error}</div>);
  }

  if (agents.length === 0) {
    return (
      <div data-testid="no-agents">
        <p>你还没有创建任何 Agent</p>
      </div>
    );
  }

  return (
    <div data-testid="agent-list">
      <h3>我的 Agents</h3>
      
      <div style={{ display: 'grid', gap: '16px' }}>
        {agents.map(agent => (
          <div 
            key={agent.id}
            onClick={() => onSelectAgent?.(agent)}
            style={{
              border: '1px solid #ddd',
              padding: '16px',
              borderRadius: '8px',
              cursor: onSelectAgent ? 'pointer' : 'default',
            }}
          >
            <h4>{agent.name}</h4>
            <div>
              {agent.skills.map(skill => (
                <span 
                  key={skill}
                  style={{
                    display: 'inline-block',
                    background: '#e0e0e0',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    marginRight: '4px',
                    fontSize: '12px',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
            <div>声誉: {agent.reputation}</div>
            <div>状态: {agent.isActive ? '活跃' : '非活跃'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

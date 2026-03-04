import React, { useState } from 'react';
import { useAgent } from '../hooks/useAgent';

const SKILL_OPTIONS = [
  'coding',
  'writing',
  'design',
  'research',
  'analysis',
  'translation',
  'data-processing',
];

export function CreateAgentForm({ onSuccess }) {
  const { createAgent, isLoading, error } = useAgent();
  const [name, setName] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [configURI, setConfigURI] = useState('');
  const [success, setSuccess] = useState(false);

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || selectedSkills.length === 0) {
      return;
    }

    try {
      await createAgent(
        name,
        selectedSkills,
        configURI || 'ipfs://default-config'
      );
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      // Error handled by hook
    }
  };

  if (success) {
    return (
      <div data-testid="create-success">
        <h3>🎉 Agent 创建成功！</h3>
        <p>你的 AI Agent 已上线</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} data-testid="create-agent-form">
      <h3>创建 AI Agent</h3>
      
      <div>
        <label htmlFor="agent-name">Agent 名称 *</label>
        <input
          id="agent-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="给你的 Agent 起个名字"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label>技能 *</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SKILL_OPTIONS.map(skill => (
            <button
              key={skill}
              type="button"
              onClick={() => toggleSkill(skill)}
              disabled={isLoading}
              style={{
                backgroundColor: selectedSkills.includes(skill) ? '#3d5a40' : '#eee',
                color: selectedSkills.includes(skill) ? 'white' : 'black',
              }}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="config-uri">配置链接 (可选)</label>
        <input
          id="config-uri"
          type="text"
          value={configURI}
          onChange={(e) => setConfigURI(e.target.value)}
          placeholder="ipfs://..."
          disabled={isLoading}
        />
      </div>

      {error && (
        <div data-testid="error-message" style={{ color: 'red' }}>
          {error}
        </div>
      )}

      <button 
        type="submit" 
        disabled={isLoading || !name.trim() || selectedSkills.length === 0}
      >
        {isLoading ? '创建中...' : '创建 Agent'}
      </button>
    </form>
  );
}

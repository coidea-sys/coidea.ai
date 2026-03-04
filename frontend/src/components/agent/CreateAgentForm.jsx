import React, { useState } from 'react';
import { useAgent } from '../../hooks/useAgent';

export function CreateAgentForm({ onSuccess }) {
  const [name, setName] = useState('');
  const [capabilities, setCapabilities] = useState('');
  const [metadataURI, setMetadataURI] = useState('');
  const [initialFund, setInitialFund] = useState('0.1');
  const { createAgent, fundAgent, isLoading, error } = useAgent();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const caps = capabilities.split(',').map(c => c.trim()).filter(Boolean);
      const agentId = await createAgent(name, caps, metadataURI || 'ipfs://default');
      
      if (initialFund && parseFloat(initialFund) > 0) {
        await fundAgent(agentId, initialFund);
      }
      
      onSuccess?.(agentId);
    } catch (err) {
      // Error is handled in hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-agent-form">
      <h2>Create New Agent</h2>
      
      <div className="form-group">
        <label htmlFor="name">Agent Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My AI Agent"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="capabilities">Capabilities (comma-separated)</label>
        <input
          id="capabilities"
          type="text"
          value={capabilities}
          onChange={(e) => setCapabilities(e.target.value)}
          placeholder="coding, analysis, writing"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="metadata">Configuration (IPFS URI)</label>
        <input
          id="metadata"
          type="text"
          value={metadataURI}
          onChange={(e) => setMetadataURI(e.target.value)}
          placeholder="ipfs://..."
        />
      </div>

      <div className="form-group">
        <label htmlFor="fund">Initial Fund (ETH)</label>
        <input
          id="fund"
          type="number"
          step="0.01"
          min="0"
          value={initialFund}
          onChange={(e) => setInitialFund(e.target.value)}
        />
      </div>

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Agent'}
      </button>
    </form>
  );
}

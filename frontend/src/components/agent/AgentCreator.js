import React, { useState } from 'react';
import './AgentCreator.css';

const AgentCreator = ({ onSuccess }) => {
  const [step, setStep] = useState(1);
  const [agentData, setAgentData] = useState({
    name: '',
    description: '',
    capabilities: [],
    initialFund: '0.01',
  });

  const capabilitiesList = [
    'coding',
    'design',
    'writing',
    'analysis',
    'research',
    'communication',
  ];

  const toggleCapability = (cap) => {
    setAgentData(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter(c => c !== cap)
        : [...prev.capabilities, cap],
    }));
  };

  const handleCreate = async () => {
    // TODO: Connect to contract
    console.log('Creating agent:', agentData);
    onSuccess?.();
  };

  return (
    <div className="agent-creator">
      <div className="creator-header">
        <h2>Create AI Agent</h2>
        <p>Create your own AI Agent to collaborate on tasks</p>
      </div>

      <div className="creator-steps">
        {['Basic Info', 'Capabilities', 'Funding'].map((label, idx) => (
          <div key={label} className={`step ${step > idx + 1 ? 'completed' : ''} ${step === idx + 1 ? 'active' : ''}`}>
            <span className="step-number">{step > idx + 1 ? '✓' : idx + 1}</span>
            <span className="step-label">{label}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="creator-form">
          <div className="form-group">
            <label>Agent Name *</label>
            <input
              type="text"
              value={agentData.name}
              onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
              placeholder="e.g., CodeAssistant"
              maxLength={32}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={agentData.description}
              onChange={(e) => setAgentData({ ...agentData, description: e.target.value })}
              placeholder="What can this agent do?"
              rows={3}
            />
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setStep(2)}
            disabled={!agentData.name}
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="creator-form">
          <div className="form-group">
            <label>Select Capabilities</label>
            <div className="capabilities-grid">
              {capabilitiesList.map((cap) => (
                <button
                  key={cap}
                  className={`capability-btn ${agentData.capabilities.includes(cap) ? 'selected' : ''}`}
                  onClick={() => toggleCapability(cap)}
                >
                  {cap}
                </button>
              ))}
            </div>
          </div>
          <div className="button-group">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="creator-form">
          <div className="form-group">
            <label>Initial Fund (MATIC)</label>
            <input
              type="number"
              value={agentData.initialFund}
              onChange={(e) => setAgentData({ ...agentData, initialFund: e.target.value })}
              min="0.01"
              step="0.01"
            />
            <span className="hint">Minimum 0.01 MATIC required</span>
          </div>
          <div className="button-group">
            <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button 
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={parseFloat(agentData.initialFund) < 0.01}
            >
              Create Agent
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentCreator;

import React, { useState, useEffect } from 'react';
import { useHuman } from '../../hooks/useHuman';
import './HumanRegistration.css';

const HumanRegistration = ({ onSuccess }) => {
  const { register, getRegistrationFee, loading, error, registrationFee } = useHuman();
  const [username, setUsername] = useState('');
  const [metadataURI, setMetadataURI] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    getRegistrationFee();
  }, [getRegistrationFee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await register(username, metadataURI || 'ipfs://default');
      onSuccess?.();
    } catch (err) {
      // Error handled by hook
    }
  };

  const isValidUsername = username.length >= 3 && username.length <= 32;

  return (
    <div className="human-registration">
      <div className="registration-header">
        <h2>Join coidea.ai</h2>
        <p className="subtitle">Create your Human account to start collaborating</p>
      </div>

      <div className="registration-steps">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Profile</span>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Payment</span>
        </div>
      </div>

      {step === 1 && (
        <form className="registration-form" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a unique username"
              minLength={3}
              maxLength={32}
              required
            />
            <span className="hint">{username.length}/32 characters</span>
          </div>

          <div className="form-group">
            <label htmlFor="metadata">Profile Metadata (optional)</label>
            <input
              type="text"
              id="metadata"
              value={metadataURI}
              onChange={(e) => setMetadataURI(e.target.value)}
              placeholder="ipfs://... or https://..."
            />
            <span className="hint">Link to your profile data on IPFS</span>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={!isValidUsername}
          >
            Continue
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="payment-step">
          <div className="fee-display">
            <span className="fee-label">Registration Fee</span>
            <span className="fee-amount">{registrationFee || '0.001'} MATIC</span>
          </div>

          <div className="benefits-list">
            <h4>What you get:</h4>
            <ul>
              <li>✓ Create and manage AI Agents</li>
              <li>✓ Post tasks and collaborate</li>
              <li>✓ Earn reputation and rewards</li>
              <li>✓ Participate in community governance</li>
            </ul>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <div className="button-group">
            <button 
              className="btn btn-secondary"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Back
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Registering...' : `Pay ${registrationFee || '0.001'} MATIC`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HumanRegistration;

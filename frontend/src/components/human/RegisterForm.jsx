import React, { useState } from 'react';
import { useHuman } from '../../hooks/useHuman';

export function RegisterForm({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [metadataURI, setMetadataURI] = useState('');
  const { register, isLoading, error } = useHuman();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(username, metadataURI || 'ipfs://default');
      onSuccess?.();
    } catch (err) {
      // Error is handled in hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      <h2>Register as Human</h2>
      
      <div className="form-group">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          required
          minLength={3}
          maxLength={32}
        />
      </div>

      <div className="form-group">
        <label htmlFor="metadata">Profile Metadata (IPFS URI)</label>
        <input
          id="metadata"
          type="text"
          value={metadataURI}
          onChange={(e) => setMetadataURI(e.target.value)}
          placeholder="ipfs://..."
        />
      </div>

      <div className="fee-notice">
        Registration fee: 0.001 ETH
      </div>

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}

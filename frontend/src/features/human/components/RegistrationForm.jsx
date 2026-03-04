import React, { useState } from 'react';
import { useHuman } from '../hooks/useHuman';
import { ethers } from 'ethers';

export function RegistrationForm({ onSuccess }) {
  const { register, isLoading, error, REGISTRATION_FEE } = useHuman();
  const [username, setUsername] = useState('');
  const [metadataURI, setMetadataURI] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      return;
    }

    try {
      await register(username, metadataURI || 'ipfs://default', {
        value: REGISTRATION_FEE,
      });
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      // Error handled by hook
    }
  };

  if (success) {
    return (
      <div data-testid="registration-success">
        <h3>🎉 注册成功！</h3>
        <p>欢迎加入 coidea.ai</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} data-testid="registration-form">
      <h3>注册 Human 账户</h3>
      
      <div>
        <label htmlFor="username">用户名 *</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="输入用户名"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="metadata">资料链接 (可选)</label>
        <input
          id="metadata"
          type="text"
          value={metadataURI}
          onChange={(e) => setMetadataURI(e.target.value)}
          placeholder="ipfs://..."
          disabled={isLoading}
        />
      </div>

      <div>
        <p>注册费用: {REGISTRATION_FEE ? ethers.formatEther(REGISTRATION_FEE.toString()) : '0.001'} ETH</p>
      </div>

      {error && (
        <div data-testid="error-message" style={{ color: 'red' }}>
          {error}
        </div>
      )}

      <button type="submit" disabled={isLoading || !username.trim()}>
        {isLoading ? '注册中...' : '注册'}
      </button>
    </form>
  );
}

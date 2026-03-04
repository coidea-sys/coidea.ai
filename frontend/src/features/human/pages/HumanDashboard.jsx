import React, { useState, useEffect } from 'react';
import { RegistrationForm } from '../components/RegistrationForm';
import { WalletManager } from '../components/WalletManager';
import { HumanProfile } from '../components/HumanProfile';
import { useHuman } from '../hooks/useHuman';

export function HumanDashboard({ account }) {
  const { checkIsHuman } = useHuman();
  const [isRegistered, setIsRegistered] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (account) {
      checkIsHuman(account).then(setIsRegistered);
    }
  }, [account]);

  if (!account) {
    return (
      <div data-testid="connect-prompt">
        <h2>请连接钱包</h2>
        <p>连接 MetaMask 以开始使用 coidea.ai</p>
      </div>
    );
  }

  if (isRegistered === false) {
    return (
      <div data-testid="registration-prompt">
        <h2>注册成为 Human</h2>
        <RegistrationForm onSuccess={() => setIsRegistered(true)} />
      </div>
    );
  }

  return (
    <div data-testid="human-dashboard">
      <h2>Human 控制台</h2>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('profile')}
          style={{ fontWeight: activeTab === 'profile' ? 'bold' : 'normal' }}
        >
          资料
        </button>
        <button 
          onClick={() => setActiveTab('wallet')}
          style={{ fontWeight: activeTab === 'wallet' ? 'bold' : 'normal' }}
        >
          钱包
        </button>
      </div>

      {activeTab === 'profile' && (
        <HumanProfile address={account} />
      )}

      {activeTab === 'wallet' && (
        <WalletManager address={account} />
      )}
    </div>
  );
}

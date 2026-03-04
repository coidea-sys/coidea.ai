import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';

export function WalletManager({ address }) {
  const { deposit, withdraw, getBalance, isLoading, error } = useWallet();
  const [balance, setBalance] = useState(null);
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState(null); // 'deposit' | 'withdraw' | null

  useEffect(() => {
    if (address) {
      loadBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const loadBalance = async () => {
    const bal = await getBalance(address);
    setBalance(bal);
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    try {
      await deposit(amount);
      setAmount('');
      setAction(null);
      await loadBalance();
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    try {
      await withdraw(amount);
      setAmount('');
      setAction(null);
      await loadBalance();
    } catch (err) {
      // Error handled by hook
    }
  };

  if (!balance) {
    return (<div data-testid="wallet-loading">加载中...</div>);
  }

  return (
    <div data-testid="wallet-manager">
      <h3>钱包管理</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <div>可用余额: {balance.available} ETH</div>
        <div>锁定中: {balance.locked} ETH</div>
        <div>已投资: {balance.invested} ETH</div>
        <div>总存入: {balance.totalDeposited} ETH</div>
        <div>总提取: {balance.totalWithdrawn} ETH</div>
      </div>

      {error && (
        <div data-testid="wallet-error" style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}

      {!action ? (
        <div>
          <button 
            onClick={() => setAction('deposit')}
            disabled={isLoading}
            data-testid="deposit-btn"
          >
            存入
          </button>
          <button 
            onClick={() => setAction('withdraw')}
            disabled={isLoading || parseFloat(balance.available) <= 0}
            data-testid="withdraw-btn"
          >
            提取
          </button>
        </div>
      ) : (
        <div data-testid="action-form">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="金额 (ETH)"
            min="0"
            step="0.001"
            disabled={isLoading}
          />
          <button 
            onClick={action === 'deposit' ? handleDeposit : handleWithdraw}
            disabled={isLoading || !amount}
            data-testid="confirm-btn"
          >
            {isLoading ? '处理中...' : (action === 'deposit' ? '确认存入' : '确认提取')}
          </button>
          <button 
            onClick={() => { setAction(null); setAmount(''); }}
            disabled={isLoading}
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
}

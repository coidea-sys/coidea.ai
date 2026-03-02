import React, { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import './WalletManager.css';

const WalletManager = ({ account }) => {
  const {
    loading,
    error,
    walletSummary,
    nativeBalance,
    fetchWalletSummary,
    fetchNativeBalance,
    deposit,
    withdraw,
  } = useWallet();

  const [activeTab, setActiveTab] = useState('overview');
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState(null); // 'deposit' or 'withdraw'

  useEffect(() => {
    if (account) {
      fetchWalletSummary();
      fetchNativeBalance(account);
    }
  }, [account, fetchWalletSummary, fetchNativeBalance]);

  const handleAction = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      if (action === 'deposit') {
        await deposit(amount);
      } else if (action === 'withdraw') {
        await withdraw(amount);
      }
      
      // Refresh data
      await fetchWalletSummary();
      await fetchNativeBalance(account);
      
      // Reset
      setAmount('');
      setAction(null);
    } catch (err) {
      // Error handled by hook
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0.0000';
    return parseFloat(num).toFixed(4);
  };

  return (
    <div className="wallet-manager">
      <div className="wallet-header">
        <h2>Wallet</h2>
        <div className="native-balance">
          <span className="label">MATIC Balance</span>
          <span className="value">{formatNumber(nativeBalance)} MATIC</span>
        </div>
      </div>

      <div className="wallet-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'investments' ? 'active' : ''}
          onClick={() => setActiveTab('investments')}
        >
          Investments
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="wallet-overview">
          <div className="balance-cards">
            <div className="balance-card available">
              <span className="label">Available</span>
              <span className="value">{formatNumber(walletSummary?.available)} MATIC</span>
            </div>
            
            <div className="balance-card locked">
              <span className="label">Locked in Tasks</span>
              <span className="value">{formatNumber(walletSummary?.lockedInTasks)} MATIC</span>
            </div>
            
            <div className="balance-card invested">
              <span className="label">Invested in Agents</span>
              <span className="value">{formatNumber(walletSummary?.investedInAgents)} MATIC</span>
            </div>
            
            <div className="balance-card total">
              <span className="label">Total Value</span>
              <span className="value">{formatNumber(walletSummary?.totalValue)} MATIC</span>
            </div>
          </div>

          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={() => setAction('deposit')}
              disabled={loading}
            >
              Deposit
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setAction('withdraw')}
              disabled={loading || !walletSummary?.available || parseFloat(walletSummary.available) <= 0}
            >
              Withdraw
            </button>
          </div>

          {action && (
            <div className="action-form">
              <div className="input-group">
                <label>{action === 'deposit' ? 'Deposit Amount' : 'Withdraw Amount'}</label>
                <div className="amount-input">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.001"
                  />
                  <span className="unit">MATIC</span>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="button-group">
                <button
                  className="btn btn-secondary"
                  onClick={() => { setAction(null); setAmount(''); }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAction}
                  disabled={loading || !amount || parseFloat(amount) <= 0}
                >
                  {loading ? 'Processing...' : action === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdraw'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'investments' && (
        <div className="wallet-investments">
          <p className="placeholder">Your Agent investments will appear here</p>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="wallet-history">
          <p className="placeholder">Transaction history will appear here</p>
        </div>
      )}
    </div>
  );
};

export default WalletManager;

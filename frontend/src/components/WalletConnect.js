import React, { useState, useEffect } from 'react';

function WalletConnect({ onConnect }) {
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState(null);

  useEffect(() => {
    checkConnection();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          const chain = await window.ethereum.request({ method: 'eth_chainId' });
          setChainId(parseInt(chain, 16));
          onConnect && onConnect(accounts[0]);
        }
      } catch (error) {
        console.error('Check connection error:', error);
      }
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      setIsConnected(true);
      onConnect && onConnect(accounts[0]);
    } else {
      setAccount('');
      setIsConnected(false);
      onConnect && onConnect(null);
    }
  };

  const handleChainChanged = (chainId) => {
    setChainId(parseInt(chainId, 16));
    window.location.reload();
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      setAccount(accounts[0]);
      setIsConnected(true);
      const chain = await window.ethereum.request({ method: 'eth_chainId' });
      setChainId(parseInt(chain, 16));
      onConnect && onConnect(accounts[0]);
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const formatAddress = (addr) => {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  };

  const isCorrectNetwork = chainId === 80002; // Amoy testnet

  return (
    <div className="wallet-connect">
      {!isConnected ? (
        <button className="btn btn-primary" onClick={connectWallet}>
          🔗 Connect Wallet
        </button>
      ) : (
        <div className="wallet-info">
          <span className={`network-badge ${isCorrectNetwork ? 'correct' : 'wrong'}`}>
            {isCorrectNetwork ? '✓ Amoy' : '⚠ Wrong Network'}
          </span>
          <span className="address">{formatAddress(account)}</span>
        </div>
      )}
    </div>
  );
}

export default WalletConnect;

import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getNetworkConfig, isLocal } from '../config/network';

function WalletConnect({ onConnect }) {
  const [account, setAccount] = useState('');
  const [, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [networkName, setNetworkName] = useState('');

  const config = getNetworkConfig();

  const updateNetworkName = useCallback((id) => {
    if (id === 31337) setNetworkName('Local');
    else if (id === 80002) setNetworkName('Amoy');
    else if (id === 137) setNetworkName('Polygon');
    else setNetworkName(`Chain ${id}`);
  }, []);

  const getSigner = async () => {
    if (!window.ethereum) return null;
    const provider = new ethers.BrowserProvider(window.ethereum);
    return await provider.getSigner();
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            const chain = await window.ethereum.request({ method: 'eth_chainId' });
            const currentChainId = parseInt(chain, 16);
            setChainId(currentChainId);
            updateNetworkName(currentChainId);
            
            const userSigner = await getSigner();
            setSigner(userSigner);
            onConnect && onConnect(accounts[0], userSigner);
          }
        } catch (error) {
          console.error('Check connection error:', error);
        }
      }
    };

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        const userSigner = await getSigner();
        setSigner(userSigner);
        onConnect && onConnect(accounts[0], userSigner);
      } else {
        setAccount('');
        setSigner(null);
        setIsConnected(false);
        onConnect && onConnect(null, null);
      }
    };

    const handleChainChanged = (chainId) => {
      setChainId(parseInt(chainId, 16));
      updateNetworkName(parseInt(chainId, 16));
      window.location.reload();
    };

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
  }, [onConnect, updateNetworkName]);

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
      const currentChainId = parseInt(chain, 16);
      setChainId(currentChainId);
      updateNetworkName(currentChainId);
      
      const userSigner = await getSigner();
      setSigner(userSigner);
      onConnect && onConnect(accounts[0], userSigner);
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const switchToLocal = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x7A69',
          chainName: 'Hardhat Local',
          nativeCurrency: {
            name: 'POL',
            symbol: 'POL',
            decimals: 18
          },
          rpcUrls: ['http://127.0.0.1:8545'],
        }]
      });
    } catch (error) {
      console.error('Switch network error:', error);
    }
  };

  const formatAddress = (addr) => {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  };

  const isCorrectNetwork = chainId === config.chainId;
  const showLocalOption = isLocal() && chainId !== 31337;

  return (
    <div className="wallet-connect">
      {!isConnected ? (
        <button className="btn btn-primary" onClick={connectWallet}>
          🔗 Connect Wallet
        </button>
      ) : (
        <div className="wallet-info">
          {showLocalOption && (
            <button className="btn btn-small" onClick={switchToLocal}>
              Switch to Local
            </button>
          )}
          <span className={`network-badge ${isCorrectNetwork ? 'correct' : 'wrong'}`}>
            {isCorrectNetwork ? `✓ ${networkName}` : `⚠ ${networkName}`}
          </span>
          <span className="address">{formatAddress(account)}</span>
        </div>
      )}
    </div>
  );
}

export default WalletConnect;

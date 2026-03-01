import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getNetworkConfig } from '../config/network';

/**
 * useContractProvider - 管理合约连接和钱包状态
 */
export function useContractProvider() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const config = getNetworkConfig();

  // 连接钱包
  const connect = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // 请求账户
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        setError('No accounts found');
        return false;
      }

      const userAccount = accounts[0];
      setAccount(userAccount);

      // 创建 provider 和 signer
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const userSigner = await browserProvider.getSigner();
      
      setProvider(browserProvider);
      setSigner(userSigner);

      // 获取链 ID
      const network = await browserProvider.getNetwork();
      setChainId(Number(network.chainId));

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // 断开连接
  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setAccount('');
    setChainId(null);
    setError(null);
  };

  // 监听账户变化
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        connect(); // 重新连接获取新的 signer
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [account]);

  // 检查是否已连接
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connect();
        }
      } catch (err) {
        console.error('Check connection error:', err);
      }
    };

    checkConnection();
  }, []);

  // 检查网络是否正确
  const isCorrectNetwork = chainId === config.chainId;

  return {
    provider,
    signer,
    account,
    chainId,
    isConnecting,
    error,
    isCorrectNetwork,
    connect,
    disconnect
  };
}

export default useContractProvider;

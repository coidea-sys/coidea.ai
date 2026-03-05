import React, { useState, useEffect } from 'react';
import { getNetworkConfig } from '../config/network';

export function NetworkCheck({ children }) {
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  const [currentChainId, setCurrentChainId] = useState(null);

  useEffect(() => {
    checkNetwork();
    
    if (window.ethereum) {
      window.ethereum.on('chainChanged', checkNetwork);
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', checkNetwork);
      }
    };
  }, []);

  const checkNetwork = async () => {
    if (!window.ethereum) return;
    
    const provider = new window.ethereum.constructor(window.ethereum);
    const chainId = await provider.request({ method: 'eth_chainId' });
    const expectedChainId = getNetworkConfig().chainId;
    
    setCurrentChainId(parseInt(chainId, 16));
    setIsCorrectNetwork(parseInt(chainId, 16) === expectedChainId);
  };

  const switchNetwork = async () => {
    const config = getNetworkConfig();
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${config.chainId.toString(16)}` }],
      });
    } catch (switchError) {
      // If network not added, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${config.chainId.toString(16)}`,
            chainName: config.name,
            rpcUrls: [config.rpc],
            nativeCurrency: {
              name: 'POL',
              symbol: 'POL',
              decimals: 18,
            },
          }],
        });
      }
    }
  };

  if (!isCorrectNetwork) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        background: '#fff3cd',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h3>⚠️ 网络错误</h3>
        <p>当前网络不正确</p>
        <p>
          当前: Chain ID {currentChainId}<br/>
          需要: {getNetworkConfig().name} (Chain ID {getNetworkConfig().chainId})
        </p>
        <button 
          onClick={switchNetwork}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          切换到正确网络
        </button>
      </div>
    );
  }

  return children;
}

import React from 'react';
import './NetworkSwitch.css';

const NETWORKS = [
  { id: 'amoy', name: 'Amoy Testnet', chainId: 80002 },
  { id: 'localhost', name: 'Local', chainId: 31337 },
  { id: 'polygon', name: 'Polygon', chainId: 137 }
];

const NetworkSwitch = ({ currentNetwork, onSwitch }) => {
  const handleSwitch = async (networkId) => {
    if (networkId === 'amoy') {
      // 请求切换到 Amoy 测试网
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13882' }], // 80002 in hex
        });
        onSwitch(networkId);
      } catch (switchError) {
        // 如果网络不存在，添加它
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x13882',
                chainName: 'Polygon Amoy Testnet',
                nativeCurrency: {
                  name: 'POL',
                  symbol: 'POL',
                  decimals: 18
                },
                rpcUrls: ['https://rpc-amoy.polygon.technology'],
                blockExplorerUrls: ['https://amoy.polygonscan.com']
              }]
            });
            onSwitch(networkId);
          } catch (addError) {
            console.error('Failed to add Amoy network:', addError);
          }
        }
      }
    } else if (networkId === 'polygon') {
      // 请求切换到 Polygon 主网
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x89' }], // 137 in hex
        });
        onSwitch(networkId);
      } catch (switchError) {
        // 如果网络不存在，添加它
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x89',
                chainName: 'Polygon Mainnet',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18
                },
                rpcUrls: ['https://polygon-rpc.com'],
                blockExplorerUrls: ['https://polygonscan.com']
              }]
            });
            onSwitch(networkId);
          } catch (addError) {
            console.error('Failed to add Polygon network:', addError);
          }
        }
      }
    } else if (networkId === 'localhost') {
      // 切换到本地网络
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x7a69' }], // 31337 in hex
        });
        onSwitch(networkId);
      } catch (error) {
        console.error('Failed to switch to localhost:', error);
      }
    }
  };

  return (
    <div className="network-switch">
      <select 
        value={currentNetwork}
        onChange={(e) => handleSwitch(e.target.value)}
        className={`network-select ${currentNetwork}`}
      >
        {NETWORKS.map(network => (
          <option key={network.id} value={network.id}>
            {network.name}
          </option>
        ))}
      </select>
      {currentNetwork === 'polygon' && (
        <span className="network-badge mainnet">Mainnet</span>
      )}
    </div>
  );
};

export default NetworkSwitch;

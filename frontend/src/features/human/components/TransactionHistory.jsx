import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';

export function TransactionHistory({ address }) {
  const { getContract } = useWallet();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const loadTransactions = async () => {
    try {
      // 从合约事件获取交易历史
      const contract = await getContract();
      const provider = contract.runner.provider;
      
      // 获取 Deposit 和 Withdraw 事件
      const depositFilter = contract.filters.Deposit(address);
      const withdrawFilter = contract.filters.Withdraw(address);
      
      const [deposits, withdraws] = await Promise.all([
        contract.queryFilter(depositFilter, -1000), // 最近1000个区块
        contract.queryFilter(withdrawFilter, -1000)
      ]);

      const allTxs = [
        ...deposits.map(d => ({
          type: 'deposit',
          amount: d.args.amount,
          timestamp: d.blockNumber,
          hash: d.transactionHash,
        })),
        ...withdraws.map(w => ({
          type: 'withdraw',
          amount: w.args.amount,
          timestamp: w.blockNumber,
          hash: w.transactionHash,
        }))
      ];

      // 按区块号排序（最新的在前）
      allTxs.sort((a, b) => b.timestamp - a.timestamp);
      
      setTransactions(allTxs.slice(0, 10)); // 只显示最近10条
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>加载交易记录...</div>;
  }

  if (transactions.length === 0) {
    return <div style={{ color: '#666', padding: '16px' }}>暂无交易记录</div>;
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h4>最近交易</h4>
      <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
        {transactions.map((tx, index) => (
          <div 
            key={index}
            style={{
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <span style={{ 
                color: tx.type === 'deposit' ? '#28a745' : '#dc3545',
                fontWeight: 'bold'
              }}>
                {tx.type === 'deposit' ? '+' : '-'}
                {ethers.formatEther(tx.amount)} POL
              </span>
              <span style={{ 
                marginLeft: '8px',
                padding: '2px 6px',
                background: tx.type === 'deposit' ? '#d4edda' : '#f8d7da',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {tx.type === 'deposit' ? '存入' : '提取'}
              </span>
            </div>
            <a 
              href={`https://amoy.polygonscan.com/tx/${tx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                fontSize: '12px', 
                color: '#007bff',
                textDecoration: 'none'
              }}
            >
              查看 →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

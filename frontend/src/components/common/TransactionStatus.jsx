import React from 'react';
import './TransactionStatus.css';

export function TransactionStatus({ status, hash, error }) {
  if (!status || status === 'idle') return null;

  return (
    <div className={`tx-status tx-status-${status}`}>
      {status === 'pending' && (
        <>
          <span className="tx-spinner">⏳</span>
          <span>交易处理中...请等待</span>
        </>
      )}
      
      {status === 'success' && (
        <>
          <span>✅</span>
          <span>交易成功！</span>
          {hash && (
            <a 
              href={`https://amoy.polygonscan.com/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tx-link"
            >
              查看交易
            </a>
          )}
        </>
      )}
      
      {status === 'error' && (
        <>
          <span>❌</span>
          <span>{error || '交易失败'}</span>
        </>
      )}
    </div>
  );
}

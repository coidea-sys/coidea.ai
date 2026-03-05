import React, { useState, useEffect } from 'react';
import './Toast.css';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const success = (message) => addToast(message, 'success');
  const error = (message) => addToast(message, 'error');
  const info = (message) => addToast(message, 'info');

  return { success, error, info, toasts };
}

export function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && '✅ '}
          {toast.type === 'error' && '❌ '}
          {toast.type === 'info' && 'ℹ️ '}
          {toast.message}
        </div>
      ))}
    </div>
  );
}

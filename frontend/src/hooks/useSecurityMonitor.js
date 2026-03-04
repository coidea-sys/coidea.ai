import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContractAddress } from '../config/network';

// Risk thresholds
const RISK_THRESHOLDS = {
  low: 0.1,      // 0.1 ETH
  medium: 1.0,   // 1 ETH
  high: 10.0,    // 10 ETH
};

// Known contract addresses
const getKnownContracts = () => [
  getContractAddress('HumanRegistry'),
  getContractAddress('AIAgentRegistry'),
  getContractAddress('HumanEconomy'),
  getContractAddress('TaskRegistry'),
  getContractAddress('AgentLifecycle'),
].filter(Boolean);

export function useSecurityMonitor(options = {}) {
  const { onAlert } = options;
  
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isSystemPaused, setIsSystemPaused] = useState(false);
  const [monitoredEvents] = useState(['Paused', 'Unpaused', 'EmergencyPause', 'EmergencyResume']);

  // Analyze transaction risk
  const analyzeTransaction = useCallback((tx) => {
    const flags = [];
    let riskLevel = 'low';

    // Check value
    const value = parseFloat(tx.value || 0);
    if (value > RISK_THRESHOLDS.high) {
      riskLevel = 'high';
      flags.push('high_value');
    } else if (value > RISK_THRESHOLDS.medium) {
      riskLevel = 'medium';
      flags.push('medium_value');
    }

    // Check recipient
    const knownContracts = getKnownContracts();
    const isKnownContract = knownContracts.some(
      addr => addr?.toLowerCase() === tx.to?.toLowerCase()
    );

    if (!isKnownContract && tx.data && tx.data !== '0x') {
      riskLevel = 'high';
      flags.push('unknown_contract');
    }

    // Check for suspicious patterns
    if (tx.data?.includes('0x8da5cb5b')) { // owner() function signature
      flags.push('owner_access');
    }

    return {
      riskLevel,
      flags,
      isSafe: riskLevel === 'low' && flags.length === 0,
    };
  }, []);

  // Record transaction
  const recordTransaction = useCallback((tx) => {
    setTransactionHistory(prev => [...prev, { ...tx, timestamp: Date.now() }]);
  }, []);

  // Trigger alert
  const triggerAlert = useCallback((alert) => {
    const newAlert = {
      ...alert,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };
    
    setAlerts(prev => [...prev, newAlert]);
    
    if (onAlert) {
      onAlert(newAlert);
    }
  }, [onAlert]);

  // Handle contract events
  const handleContractEvent = useCallback((event) => {
    if (event.event === 'Paused' || event.event === 'EmergencyPause') {
      setIsSystemPaused(true);
      triggerAlert({
        type: 'system_pause',
        severity: 'high',
        message: 'System has been paused. Transactions are temporarily disabled.',
      });
    }
    
    if (event.event === 'Unpaused' || event.event === 'EmergencyResume') {
      setIsSystemPaused(false);
      triggerAlert({
        type: 'system_resume',
        severity: 'info',
        message: 'System has resumed normal operation.',
      });
    }
  }, [triggerAlert]);

  // Calculate stats
  const stats = useMemo(() => {
    const count = transactionHistory.length;
    const totalVolume = transactionHistory.reduce(
      (sum, tx) => sum + parseFloat(tx.value || 0),
      0
    );
    
    return {
      transactionCount: count,
      totalVolume: totalVolume.toFixed(4),
      alertCount: alerts.length,
    };
  }, [transactionHistory, alerts]);

  // Monitor for suspicious patterns
  useEffect(() => {
    const checkSuspiciousPatterns = () => {
      // Check for rapid transactions
      const recentTx = transactionHistory.filter(
        tx => Date.now() - tx.timestamp < 60000 // Last minute
      );
      
      if (recentTx.length > 5) {
        triggerAlert({
          type: 'rapid_transactions',
          severity: 'medium',
          message: 'Multiple transactions detected in short time. Please verify your actions.',
        });
      }
    };

    const interval = setInterval(checkSuspiciousPatterns, 10000);
    return () => clearInterval(interval);
  }, [transactionHistory, triggerAlert]);

  return {
    analyzeTransaction,
    recordTransaction,
    triggerAlert,
    handleContractEvent,
    transactionHistory,
    alerts,
    isSystemPaused,
    monitoredEvents,
    ...stats,
  };
}

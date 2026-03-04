import { useState, useCallback, useMemo } from 'react';
import { getContractAddress } from '../config/network';

// Official domains
const OFFICIAL_DOMAINS = [
  'coidea.ai',
  'www.coidea.ai',
  'app.coidea.ai',
  'coidea-ai.pages.dev', // Cloudflare preview
  'localhost', // Development
];

// Security reminders
const SECURITY_REMINDERS = [
  '我们永远不会要求你的私钥或助记词',
  '确认网站地址正确: https://coidea.ai',
  '定期检查并撤销不必要的授权: https://revoke.cash',
  '使用硬件钱包管理大额资金',
  '警惕钓鱼网站和虚假空投',
];

// High value threshold (ETH)
const HIGH_VALUE_THRESHOLD = 1.0;

export function useSecurity() {
  const [lastWarning, setLastWarning] = useState(null);

  // Check if current domain is official
  const isSafeDomain = useMemo(() => {
    const hostname = window.location?.hostname || '';
    
    // Exact match
    if (OFFICIAL_DOMAINS.includes(hostname)) {
      return true;
    }
    
    // Check for similar domains (basic check)
    const normalizedHost = hostname.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedOfficial = 'coideaai';
    
    // If too similar but not exact, might be phishing
    if (normalizedHost.includes('coidea') && normalizedHost !== normalizedOfficial) {
      return false;
    }
    
    return false;
  }, []);

  // Warning message
  const warning = useMemo(() => {
    if (isSafeDomain) return null;
    
    return `⚠️ 警告: 您可能正在访问非官方网站 (${window.location?.hostname})。
    
官方地址: https://coidea.ai

请确认网站地址正确后再连接钱包。`;
  }, [isSafeDomain]);

  // Validate transaction
  const validateTransaction = useCallback((tx) => {
    // Check if recipient is a known contract
    const knownContracts = [
      getContractAddress('HumanRegistry'),
      getContractAddress('AIAgentRegistry'),
      getContractAddress('HumanEconomy'),
      getContractAddress('TaskRegistry'),
      getContractAddress('AgentLifecycle'),
    ].filter(Boolean);

    const isKnownContract = knownContracts.some(
      addr => addr?.toLowerCase() === tx.to?.toLowerCase()
    );

    if (!isKnownContract && tx.data && tx.data !== '0x') {
      return {
        valid: false,
        reason: '未知合约地址，请确认交易安全',
        severity: 'high'
      };
    }

    // Check value
    const value = parseFloat(tx.value || 0);
    if (value > HIGH_VALUE_THRESHOLD) {
      return {
        valid: false,
        reason: `高额交易 (${value} ETH)，请确认金额正确`,
        severity: 'medium'
      };
    }

    return { valid: true };
  }, []);

  // Show security warning
  const showWarning = useCallback((message) => {
    setLastWarning(message);
    // In real implementation, this would show a modal
    console.warn('Security Warning:', message);
  }, []);

  return {
    isSafeDomain,
    warning,
    reminders: SECURITY_REMINDERS,
    validateTransaction,
    showWarning,
    lastWarning,
  };
}

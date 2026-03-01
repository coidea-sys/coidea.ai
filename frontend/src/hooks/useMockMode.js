import { useState, useCallback } from 'react';

/**
 * useMockMode - 模拟数据模式开关
 * 
 * 用于 Cloudflare Pages 部署，无需区块链连接
 * 可随时切换回真实模式
 */
export function useMockMode() {
  // 从环境变量或 localStorage 读取模式
  const [isMockMode, setIsMockMode] = useState(() => {
    // 优先使用环境变量
    if (process.env.REACT_APP_MOCK_MODE === 'true') {
      return true;
    }
    // 其次使用 localStorage
    const saved = localStorage.getItem('coidea_mock_mode');
    return saved === 'true';
  });

  const toggleMockMode = useCallback(() => {
    setIsMockMode(prev => {
      const newValue = !prev;
      localStorage.setItem('coidea_mock_mode', newValue.toString());
      // 刷新页面以应用更改
      window.location.reload();
      return newValue;
    });
  }, []);

  const enableMockMode = useCallback(() => {
    setIsMockMode(true);
    localStorage.setItem('coidea_mock_mode', 'true');
  }, []);

  const disableMockMode = useCallback(() => {
    setIsMockMode(false);
    localStorage.setItem('coidea_mock_mode', 'false');
  }, []);

  return {
    isMockMode,
    toggleMockMode,
    enableMockMode,
    disableMockMode
  };
}

export default useMockMode;

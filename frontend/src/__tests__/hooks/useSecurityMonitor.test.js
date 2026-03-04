import { renderHook, act } from '@testing-library/react';
import { useSecurityMonitor } from '../hooks/useSecurityMonitor';

describe('useSecurityMonitor Hook', () => {
  const mockProvider = {
    on: jest.fn(),
    removeListener: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Transaction Monitoring', () => {
    it('should detect suspicious transaction patterns', () => {
      const { result } = renderHook(() => useSecurityMonitor());

      const suspiciousTx = {
        to: '0x1234567890123456789012345678901234567890',
        value: '100.0',
        data: '0x',
      };

      const analysis = result.current.analyzeTransaction(suspiciousTx);

      expect(analysis.riskLevel).toBe('high');
      expect(analysis.flags).toContain('high_value');
    });

    it('should allow normal transactions', () => {
      const { result } = renderHook(() => useSecurityMonitor());

      const normalTx = {
        to: '0xa7049DB55AE7D67FBC006734752DD1fe24687bE3',
        value: '0.01',
        data: '0x',
      };

      const analysis = result.current.analyzeTransaction(normalTx);

      expect(analysis.riskLevel).toBe('low');
    });

    it('should track transaction history', () => {
      const { result } = renderHook(() => useSecurityMonitor());

      act(() => {
        result.current.recordTransaction({ hash: '0x123', value: '1.0' });
        result.current.recordTransaction({ hash: '0x456', value: '2.0' });
      });

      expect(result.current.transactionCount).toBe(2);
      expect(result.current.totalVolume).toBe('3.0');
    });
  });

  describe('Alert System', () => {
    it('should trigger alert on suspicious activity', () => {
      const alertHandler = jest.fn();
      const { result } = renderHook(() => useSecurityMonitor({ onAlert: alertHandler }));

      act(() => {
        result.current.triggerAlert({
          type: 'suspicious_transaction',
          severity: 'high',
          message: 'Large transaction detected',
        });
      });

      expect(alertHandler).toHaveBeenCalled();
    });

    it('should maintain alert history', () => {
      const { result } = renderHook(() => useSecurityMonitor());

      act(() => {
        result.current.triggerAlert({ type: 'test', severity: 'low' });
      });

      expect(result.current.alerts.length).toBe(1);
    });
  });

  describe('Contract Monitoring', () => {
    it('should detect contract pause events', () => {
      const { result } = renderHook(() => useSecurityMonitor());

      const mockEvent = {
        event: 'Paused',
        args: { account: '0x123...' },
      };

      act(() => {
        result.current.handleContractEvent(mockEvent);
      });

      expect(result.current.isSystemPaused).toBe(true);
    });

    it('should monitor for security events', () => {
      const { result } = renderHook(() => useSecurityMonitor());

      expect(result.current.monitoredEvents).toContain('Paused');
      expect(result.current.monitoredEvents).toContain('EmergencyPause');
    });
  });
});

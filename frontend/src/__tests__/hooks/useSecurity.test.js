import { renderHook } from '@testing-library/react';
import { useSecurity } from '../hooks/useSecurity';

describe('useSecurity Hook', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Reset window.location
    delete window.location;
    window.location = { hostname: 'coidea.ai' };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  describe('Domain Verification', () => {
    it('should return safe for official domain', () => {
      window.location = { hostname: 'coidea.ai' };
      const { result } = renderHook(() => useSecurity());
      
      expect(result.current.isSafeDomain).toBe(true);
      expect(result.current.warning).toBeNull();
    });

    it('should return safe for www subdomain', () => {
      window.location = { hostname: 'www.coidea.ai' };
      const { result } = renderHook(() => useSecurity());
      
      expect(result.current.isSafeDomain).toBe(true);
    });

    it('should return unsafe for phishing domain', () => {
      window.location = { hostname: 'coidea-airdrops.com' };
      const { result } = renderHook(() => useSecurity());
      
      expect(result.current.isSafeDomain).toBe(false);
      expect(result.current.warning).toContain('unofficial');
    });

    it('should return unsafe for similar domain', () => {
      window.location = { hostname: 'co1dea.ai' };
      const { result } = renderHook(() => useSecurity());
      
      expect(result.current.isSafeDomain).toBe(false);
    });
  });

  describe('Transaction Validation', () => {
    it('should validate transaction recipient', () => {
      const { result } = renderHook(() => useSecurity());
      
      const validTx = {
        to: '0xa7049DB55AE7D67FBC006734752DD1fe24687bE3',
        value: '0.001'
      };
      
      const isValid = result.current.validateTransaction(validTx);
      expect(isValid.valid).toBe(true);
    });

    it('should reject high value transactions without confirmation', () => {
      const { result } = renderHook(() => useSecurity());
      
      const highValueTx = {
        to: '0xa7049DB55AE7D67FBC006734752DD1fe24687bE3',
        value: '10.0'
      };
      
      const isValid = result.current.validateTransaction(highValueTx);
      expect(isValid.valid).toBe(false);
      expect(isValid.reason).toContain('high value');
    });

    it('should reject unknown contract addresses', () => {
      const { result } = renderHook(() => useSecurity());
      
      const unknownTx = {
        to: '0x1234567890123456789012345678901234567890',
        value: '0.1'
      };
      
      const isValid = result.current.validateTransaction(unknownTx);
      expect(isValid.valid).toBe(false);
      expect(isValid.reason).toContain('unknown');
    });
  });

  describe('Security Reminders', () => {
    it('should provide security reminders', () => {
      const { result } = renderHook(() => useSecurity());
      
      expect(result.current.reminders).toContain('never share private keys');
      expect(result.current.reminders).toContain('verify website address');
      expect(result.current.reminders).toContain('revoke unnecessary approvals');
    });
  });
});

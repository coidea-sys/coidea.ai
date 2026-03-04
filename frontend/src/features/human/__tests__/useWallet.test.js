import { renderHook } from '@testing-library/react';
import { useWallet } from '../hooks/useWallet';

describe('useWallet Hook', () => {
  it('should export deposit function', () => {
    const { result } = renderHook(() => useWallet());
    expect(typeof result.current.deposit).toBe('function');
  });

  it('should export withdraw function', () => {
    const { result } = renderHook(() => useWallet());
    expect(typeof result.current.withdraw).toBe('function');
  });

  it('should export getBalance function', () => {
    const { result } = renderHook(() => useWallet());
    expect(typeof result.current.getBalance).toBe('function');
  });

  it('should have isLoading state', () => {
    const { result } = renderHook(() => useWallet());
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should have error state', () => {
    const { result } = renderHook(() => useWallet());
    expect(result.current.error).toBeNull();
  });
});

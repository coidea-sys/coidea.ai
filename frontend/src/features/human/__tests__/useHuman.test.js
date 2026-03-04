import { renderHook } from '@testing-library/react';
import { useHuman } from '../hooks/useHuman';

describe('useHuman Hook', () => {
  it('should export register function', () => {
    const { result } = renderHook(() => useHuman());
    expect(typeof result.current.register).toBe('function');
  });

  it('should export getHuman function', () => {
    const { result } = renderHook(() => useHuman());
    expect(typeof result.current.getHuman).toBe('function');
  });

  it('should export checkIsHuman function', () => {
    const { result } = renderHook(() => useHuman());
    expect(typeof result.current.checkIsHuman).toBe('function');
  });

  it('should export updateProfile function', () => {
    const { result } = renderHook(() => useHuman());
    expect(typeof result.current.updateProfile).toBe('function');
  });

  it('should have isLoading state', () => {
    const { result } = renderHook(() => useHuman());
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should have error state', () => {
    const { result } = renderHook(() => useHuman());
    expect(result.current.error).toBeNull();
  });

  it('should have REGISTRATION_FEE constant', () => {
    const { result } = renderHook(() => useHuman());
    expect(result.current.REGISTRATION_FEE).toBeDefined();
  });
});

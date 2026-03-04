import { renderHook } from '@testing-library/react';
import { useAgent } from '../hooks/useAgent';

describe('useAgent Hook', () => {
  it('should export createAgent function', () => {
    const { result } = renderHook(() => useAgent());
    expect(typeof result.current.createAgent).toBe('function');
  });

  it('should export getAgent function', () => {
    const { result } = renderHook(() => useAgent());
    expect(typeof result.current.getAgent).toBe('function');
  });

  it('should export getMyAgents function', () => {
    const { result } = renderHook(() => useAgent());
    expect(typeof result.current.getMyAgents).toBe('function');
  });

  it('should export isAgentOwner function', () => {
    const { result } = renderHook(() => useAgent());
    expect(typeof result.current.isAgentOwner).toBe('function');
  });

  it('should have isLoading state', () => {
    const { result } = renderHook(() => useAgent());
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should have error state', () => {
    const { result } = renderHook(() => useAgent());
    expect(result.current.error).toBeNull();
  });
});

import { renderHook } from '@testing-library/react';
import { useTask } from '../hooks/useTask';

describe('useTask Hook', () => {
  it('should export createTask function', () => {
    const { result } = renderHook(() => useTask());
    expect(typeof result.current.createTask).toBe('function');
  });

  it('should export getTask function', () => {
    const { result } = renderHook(() => useTask());
    expect(typeof result.current.getTask).toBe('function');
  });

  it('should export getAllTasks function', () => {
    const { result } = renderHook(() => useTask());
    expect(typeof result.current.getAllTasks).toBe('function');
  });

  it('should export applyForTask function', () => {
    const { result } = renderHook(() => useTask());
    expect(typeof result.current.applyForTask).toBe('function');
  });

  it('should export submitWork function', () => {
    const { result } = renderHook(() => useTask());
    expect(typeof result.current.submitWork).toBe('function');
  });

  it('should export assignTask function', () => {
    const { result } = renderHook(() => useTask());
    expect(typeof result.current.assignTask).toBe('function');
  });

  it('should export publishTask function', () => {
    const { result } = renderHook(() => useTask());
    expect(typeof result.current.publishTask).toBe('function');
  });

  it('should export getContract function', () => {
    const { result } = renderHook(() => useTask());
    expect(typeof result.current.getContract).toBe('function');
  });

  it('should have isLoading state', () => {
    const { result } = renderHook(() => useTask());
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should have error state', () => {
    const { result } = renderHook(() => useTask());
    expect(result.current.error).toBeNull();
  });
});

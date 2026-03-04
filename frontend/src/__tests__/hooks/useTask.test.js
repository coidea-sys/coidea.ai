import { renderHook, act } from '@testing-library/react';
import { useTask } from '../hooks/useTask';
import { ethers } from 'ethers';

jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  BrowserProvider: jest.fn(),
  Contract: jest.fn(),
  parseEther: jest.fn((val) => val),
  formatEther: jest.fn((val) => val),
}));

describe('useTask Hook', () => {
  const mockContract = {
    createTask: jest.fn(),
    getTask: jest.fn(),
    applyForTask: jest.fn(),
    submitTask: jest.fn(),
    completeTask: jest.fn(),
    getTaskCount: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    ethers.Contract.mockImplementation(() => mockContract);
  });

  describe('Task Creation', () => {
    it('should create a new task with title, description and reward', async () => {
      // Arrange
      mockContract.createTask.mockResolvedValue({
        wait: jest.fn().mockResolvedValue(true)
      });
      
      // Act
      const { result } = renderHook(() => useTask());
      
      await act(async () => {
        await result.current.createTask({
          title: 'Build a website',
          description: 'Create a landing page',
          reward: '0.1',
          deadline: 7,
        });
      });
      
      // Assert
      expect(mockContract.createTask).toHaveBeenCalledWith(
        'Build a website',
        'Create a landing page',
        expect.any(Number),
        '0.1',
        expect.any(Number),
        expect.any(Array),
        expect.any(Number),
        expect.any(Boolean),
        { value: '0.1' }
      );
    });

    it('should require minimum reward of 0.001 ETH', async () => {
      // Act
      const { result } = renderHook(() => useTask());
      
      await act(async () => {
        try {
          await result.current.createTask({
            title: 'Small task',
            description: 'Too small',
            reward: '0.0001',
            deadline: 7,
          });
        } catch (e) {
          // Expected error
        }
      });
      
      // Assert
      expect(result.current.error).toContain('minimum');
    });
  });

  describe('Task Application', () => {
    it('should apply for a task with proposal', async () => {
      // Arrange
      mockContract.applyForTask.mockResolvedValue({
        wait: jest.fn().mockResolvedValue(true)
      });
      
      // Act
      const { result } = renderHook(() => useTask());
      
      await act(async () => {
        await result.current.applyForTask(1, 'I can do this', '0.08');
      });
      
      // Assert
      expect(mockContract.applyForTask).toHaveBeenCalledWith(
        1,
        'I can do this',
        '0.08'
      );
    });
  });

  describe('Task Completion', () => {
    it('should submit task completion with deliverable', async () => {
      // Arrange
      mockContract.submitTask.mockResolvedValue({
        wait: jest.fn().mockResolvedValue(true)
      });
      
      // Act
      const { result } = renderHook(() => useTask());
      
      await act(async () => {
        await result.current.submitTask(1, 'ipfs://deliverable');
      });
      
      // Assert
      expect(mockContract.submitTask).toHaveBeenCalledWith(
        1,
        'ipfs://deliverable'
      );
    });

    it('should complete task and release payment', async () => {
      // Arrange
      mockContract.completeTask.mockResolvedValue({
        wait: jest.fn().mockResolvedValue(true)
      });
      
      // Act
      const { result } = renderHook(() => useTask());
      
      await act(async () => {
        await result.current.completeTask(1);
      });
      
      // Assert
      expect(mockContract.completeTask).toHaveBeenCalledWith(1);
    });
  });

  describe('Task List', () => {
    it('should fetch all tasks', async () => {
      // Arrange
      mockContract.getTaskCount.mockResolvedValue(5);
      
      // Act
      const { result } = renderHook(() => useTask());
      
      await act(async () => {
        await result.current.fetchTasks();
      });
      
      // Assert
      expect(result.current.taskCount).toBe(5);
    });
  });
});

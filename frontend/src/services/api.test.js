/**
 * API Service Unit Tests
 * TDD for frontend API service
 */

import api from '../services/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Service', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('health.check', () => {
    it('should return health status', async () => {
      const mockResponse = { status: 'ok' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse })
      });

      const result = await api.health.check();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' }
        })
      );
      expect(result.data).toEqual(mockResponse);
    });

    it('should throw error on failed request', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: 'Server error' })
      });

      await expect(api.health.check()).rejects.toThrow('Server error');
    });
  });

  describe('agents.getById', () => {
    it('should fetch agent by tokenId', async () => {
      const mockAgent = { tokenId: '1', agentName: 'Test Agent' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockAgent })
      });

      const result = await api.agents.getById('1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/agents/1'),
        expect.any(Object)
      );
      expect(result.data).toEqual(mockAgent);
    });
  });

  describe('agents.getByWallet', () => {
    it('should fetch agent by wallet address', async () => {
      const mockAgent = { agentWallet: '0x123', agentName: 'Test' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockAgent })
      });

      const result = await api.agents.getByWallet('0x123');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/agents/wallet/0x123'),
        expect.any(Object)
      );
      expect(result.data).toEqual(mockAgent);
    });
  });

  describe('agents.register', () => {
    it('should register new agent', async () => {
      const agentData = {
        agentName: 'New Agent',
        agentURI: 'ipfs://test',
        agentWallet: '0xabc'
      };
      const mockResponse = { tokenId: '1', ...agentData };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse })
      });

      const result = await api.agents.register(agentData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/agents/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(agentData)
        })
      );
      expect(result.data.tokenId).toBe('1');
    });
  });

  describe('tasks.getActive', () => {
    it('should fetch active tasks', async () => {
      const mockTasks = ['1', '2', '3'];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTasks })
      });

      const result = await api.tasks.getActive();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tasks/list/active'),
        expect.any(Object)
      );
      expect(result.data).toEqual(mockTasks);
    });
  });

  describe('tasks.getById', () => {
    it('should fetch task by id', async () => {
      const mockTask = { id: '1', title: 'Test Task' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTask })
      });

      const result = await api.tasks.getById('1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tasks/1'),
        expect.any(Object)
      );
      expect(result.data).toEqual(mockTask);
    });
  });

  describe('tasks.create', () => {
    it('should create new task', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Test description',
        reward: '1000'
      };
      const mockResponse = { taskId: '1', ...taskData };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse })
      });

      const result = await api.tasks.create(taskData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tasks/create'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(taskData)
        })
      );
      expect(result.data.taskId).toBe('1');
    });
  });

  describe('humans.getById', () => {
    it('should fetch human by tokenId', async () => {
      const mockHuman = { tokenId: '1', name: 'Test Human' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockHuman })
      });

      const result = await api.humans.getById('1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/humans/1'),
        expect.any(Object)
      );
      expect(result.data).toEqual(mockHuman);
    });
  });

  describe('humans.getLevel', () => {
    it('should fetch human level', async () => {
      const mockLevel = { level: 2, levelName: 'Contributor' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockLevel })
      });

      const result = await api.humans.getLevel('1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/humans/1/level'),
        expect.any(Object)
      );
      expect(result.data.level).toBe(2);
    });
  });

  describe('humans.getPermissions', () => {
    it('should fetch human permissions', async () => {
      const mockPermissions = {
        canPublishTask: true,
        canArbitrate: false,
        canGovern: false
      };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPermissions })
      });

      const result = await api.humans.getPermissions('1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/humans/1/permissions'),
        expect.any(Object)
      );
      expect(result.data.canPublishTask).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(api.health.check()).rejects.toThrow('Network error');
    });

    it('should handle JSON parse errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      await expect(api.health.check()).rejects.toThrow();
    });
  });
});

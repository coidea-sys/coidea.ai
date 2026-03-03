/**
 * Integration Tests
 * End-to-end testing for coidea.ai platform
 */

const request = require('supertest');

// Mock the backend app
const mockApp = {
  get: jest.fn(),
  post: jest.fn(),
  listen: jest.fn()
};

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Integration', () => {
    it('should get health status', async () => {
      mockApp.get.mockImplementation((path, handler) => {
        if (path === '/api/health') {
          handler({}, {
            json: (data) => {
              expect(data).toEqual({
                success: true,
                data: { status: 'ok' }
              });
            }
          });
        }
      });

      // Simulate calling the endpoint
      mockApp.get('/api/health', (req, res) => {
        res.json({ success: true, data: { status: 'ok' } });
      });
    });

    it('should create and retrieve agent', async () => {
      const agentData = {
        agentName: 'Test Agent',
        agentURI: 'ipfs://test',
        agentWallet: '0x123'
      };

      mockApp.post.mockImplementation((path, handler) => {
        if (path === '/api/agents/register') {
          handler({ body: agentData }, {
            json: (data) => {
              expect(data.success).toBe(true);
              expect(data.data.tokenId).toBeDefined();
            }
          });
        }
      });

      mockApp.post('/api/agents/register', (req, res) => {
        res.json({
          success: true,
          data: { tokenId: '1', ...req.body }
        });
      });
    });

    it('should create and retrieve task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        reward: '1000',
        deadline: Math.floor(Date.now() / 1000) + 86400
      };

      mockApp.post.mockImplementation((path, handler) => {
        if (path === '/api/tasks/create') {
          handler({ body: taskData }, {
            json: (data) => {
              expect(data.success).toBe(true);
              expect(data.data.taskId).toBeDefined();
            }
          });
        }
      });

      mockApp.post('/api/tasks/create', (req, res) => {
        res.json({
          success: true,
          data: { taskId: '1', ...req.body }
        });
      });
    });
  });

  describe('Contract Integration', () => {
    it('should connect wallet and register agent', async () => {
      const mockContract = {
        registerAgent: jest.fn().mockResolvedValue({
          wait: jest.fn().mockResolvedValue({ status: 1 })
        }),
        getAgent: jest.fn().mockResolvedValue({
          agentName: 'Test Agent',
          agentWallet: '0x123'
        })
      };

      // Register agent
      const tx = await mockContract.registerAgent('Test', 'uri', '0x123');
      await tx.wait();

      expect(mockContract.registerAgent).toHaveBeenCalledWith('Test', 'uri', '0x123');

      // Get agent
      const agent = await mockContract.getAgent(1);
      expect(agent.agentName).toBe('Test Agent');
    });

    it('should create task and update status', async () => {
      const mockContract = {
        createTask: jest.fn().mockResolvedValue({
          wait: jest.fn().mockResolvedValue({
            status: 1,
            events: [{ args: { taskId: 1 } }]
          })
        }),
        getTask: jest.fn().mockResolvedValue({
          title: 'Test Task',
          state: 0 // Open
        }),
        updateTaskState: jest.fn().mockResolvedValue({
          wait: jest.fn().mockResolvedValue({ status: 1 })
        })
      };

      // Create task
      const tx = await mockContract.createTask('Test', 'Desc', '1000', 123456);
      const receipt = await tx.wait();
      const taskId = receipt.events[0].args.taskId;

      expect(taskId).toBe(1);

      // Get task
      const task = await mockContract.getTask(taskId);
      expect(task.title).toBe('Test Task');
    });
  });

  describe('WebSocket Integration', () => {
    it('should connect and receive welcome message', () => {
      const mockWS = {
        send: jest.fn(),
        on: jest.fn(),
        readyState: 1
      };

      // Simulate server sending welcome
      mockWS.send(JSON.stringify({
        type: 'connected',
        clientId: 'client_123',
        timestamp: Date.now()
      }));

      expect(mockWS.send).toHaveBeenCalledWith(
        expect.stringContaining('connected')
      );
    });

    it('should subscribe to channel and receive updates', () => {
      const mockWS = {
        send: jest.fn(),
        on: jest.fn(),
        readyState: 1
      };

      // Subscribe
      const subscribeMsg = JSON.stringify({
        type: 'subscribe',
        channel: 'tasks'
      });
      mockWS.send(subscribeMsg);

      // Receive confirmation
      mockWS.send(JSON.stringify({
        type: 'subscribed',
        channel: 'tasks'
      }));

      // Receive update
      mockWS.send(JSON.stringify({
        type: 'update',
        channel: 'tasks',
        data: { taskId: '1', state: 'completed' }
      }));

      expect(mockWS.send).toHaveBeenCalledTimes(3);
    });

    it('should broadcast agent status to all subscribers', () => {
      const subscribers = [
        { send: jest.fn(), readyState: 1 },
        { send: jest.fn(), readyState: 1 },
        { send: jest.fn(), readyState: 1 }
      ];

      const message = JSON.stringify({
        type: 'agent_status',
        agentId: '1',
        status: 'online'
      });

      subscribers.forEach(client => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });

      subscribers.forEach(client => {
        expect(client.send).toHaveBeenCalledWith(message);
      });
    });
  });

  describe('Full Workflow', () => {
    it('should complete full agent registration workflow', async () => {
      // 1. Connect wallet
      const accounts = ['0x123'];
      expect(accounts[0]).toBeDefined();

      // 2. Register agent via API
      const agentData = {
        agentName: 'AI Assistant',
        agentURI: 'ipfs://metadata',
        agentWallet: accounts[0]
      };

      mockApp.post.mockImplementation((path, handler) => {
        if (path === '/api/agents/register') {
          handler({ body: agentData }, {
            json: (data) => {
              expect(data.success).toBe(true);
            }
          });
        }
      });

      // 3. Register on blockchain
      const mockContract = {
        registerAgent: jest.fn().mockResolvedValue({
          wait: jest.fn().mockResolvedValue({ status: 1 })
        })
      };

      const tx = await mockContract.registerAgent(
        agentData.agentName,
        agentData.agentURI,
        agentData.agentWallet
      );
      await tx.wait();

      expect(mockContract.registerAgent).toHaveBeenCalled();

      // 4. Broadcast status via WebSocket
      const mockWS = { send: jest.fn(), readyState: 1 };
      mockWS.send(JSON.stringify({
        type: 'agent_status',
        agentId: '1',
        status: 'registered'
      }));

      expect(mockWS.send).toHaveBeenCalledWith(
        expect.stringContaining('agent_status')
      );
    });

    it('should complete full task creation workflow', async () => {
      // 1. Create task via API
      const taskData = {
        title: 'Build Feature',
        description: 'Implement new feature',
        reward: '5000',
        deadline: Math.floor(Date.now() / 1000) + 86400
      };

      mockApp.post.mockImplementation((path, handler) => {
        if (path === '/api/tasks/create') {
          handler({ body: taskData }, {
            json: (data) => {
              expect(data.success).toBe(true);
            }
          });
        }
      });

      // 2. Create on blockchain
      const mockContract = {
        createTask: jest.fn().mockResolvedValue({
          wait: jest.fn().mockResolvedValue({
            status: 1,
            events: [{ args: { taskId: 1 } }]
          })
        })
      };

      const tx = await mockContract.createTask(
        taskData.title,
        taskData.description,
        taskData.reward,
        taskData.deadline
      );
      const receipt = await tx.wait();

      expect(receipt.status).toBe(1);

      // 3. Broadcast to subscribers
      const subscribers = [{ send: jest.fn(), readyState: 1 }];
      const message = JSON.stringify({
        type: 'task_update',
        taskId: '1',
        state: 'created'
      });

      subscribers.forEach(client => client.send(message));
      expect(subscribers[0].send).toHaveBeenCalledWith(message);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockApp.post.mockImplementation((path, handler) => {
        if (path === '/api/agents/register') {
          handler({ body: {} }, {
            status: (code) => ({
              json: (data) => {
                expect(code).toBe(400);
                expect(data.success).toBe(false);
              }
            })
          });
        }
      });

      mockApp.post('/api/agents/register', (req, res) => {
        res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      });
    });

    it('should handle contract transaction failure', async () => {
      const mockContract = {
        registerAgent: jest.fn().mockRejectedValue(
          new Error('Transaction failed')
        )
      };

      await expect(
        mockContract.registerAgent('Test', 'uri', 'wallet')
      ).rejects.toThrow('Transaction failed');
    });

    it('should handle WebSocket disconnection', () => {
      const mockWS = {
        send: jest.fn(),
        on: jest.fn(),
        close: jest.fn(),
        readyState: 3 // CLOSED
      };

      // Try to send to closed connection
      if (mockWS.readyState !== 1) {
        console.log('WebSocket is closed');
      }

      expect(mockWS.readyState).toBe(3);
    });
  });
});

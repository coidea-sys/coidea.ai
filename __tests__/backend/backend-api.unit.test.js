/**
 * Backend API Unit Tests
 * Uses mocked blockchain service for TDD
 */

const request = require('supertest');

// Set test port before importing app
process.env.PORT = '0';
process.env.NODE_ENV = 'test';

// Mock blockchain service before importing app
jest.mock('../../backend/services/blockchain', () => {
  const mockSigner = { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' };
  return {
    getAgent: jest.fn(),
    getAgentByWallet: jest.fn(),
    registerAgent: jest.fn(),
    getTask: jest.fn(),
    createTask: jest.fn(),
    publishTask: jest.fn(),
    getSigner: jest.fn(() => mockSigner),
    contracts: {
      aiAgentRegistry: { address: '0x123' },
      taskRegistry: { address: '0x456' }
    }
  };
});

const app = require('../../backend/index');
const blockchain = require('../../backend/services/blockchain');

describe('Backend API - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);
      
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Agents API', () => {
    describe('POST /api/agents/register', () => {
      it('should register a new agent', async () => {
        const mockResult = {
          tokenId: '1',
          agentName: 'Test Agent',
          agentURI: 'ipfs://test',
          agentWallet: '0xabc',
          transactionHash: '0xhash',
          blockNumber: '1'
        };
        blockchain.registerAgent.mockResolvedValue(mockResult);

        const res = await request(app)
          .post('/api/agents/register')
          .send({
            agentName: 'Test Agent',
            agentURI: 'ipfs://test',
            agentWallet: '0xabc'
          })
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.data.tokenId).toBe('1');
        expect(blockchain.registerAgent).toHaveBeenCalledWith(
          'Test Agent',
          'ipfs://test',
          '0xabc',
          expect.objectContaining({ address: expect.any(String) })
        );
      });

      it('should fail without required fields', async () => {
        const res = await request(app)
          .post('/api/agents/register')
          .send({ agentName: 'Test' })
          .expect(400);
        
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('Missing required fields');
      });
    });

    describe('GET /api/agents/:tokenId', () => {
      it('should get agent by tokenId', async () => {
        const mockAgent = {
          agentName: 'Test Agent',
          agentURI: 'ipfs://test',
          agentWallet: '0xabc',
          state: '1'
        };
        blockchain.getAgent.mockResolvedValue(mockAgent);

        const res = await request(app)
          .get('/api/agents/1')
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.data.agentName).toBe('Test Agent');
        expect(blockchain.getAgent).toHaveBeenCalledWith('1');
      });

      it('should return null for non-existent agent', async () => {
        blockchain.getAgent.mockResolvedValue(null);

        const res = await request(app)
          .get('/api/agents/999')
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeNull();
      });
    });
  });

  describe('Tasks API', () => {
    describe('POST /api/tasks/create', () => {
      it('should create a new task', async () => {
        const mockResult = {
          taskId: '1',
          title: 'Test Task',
          reward: '1000',
          transactionHash: '0xhash',
          blockNumber: '1'
        };
        blockchain.createTask.mockResolvedValue(mockResult);

        const res = await request(app)
          .post('/api/tasks/create')
          .send({
            title: 'Test Task',
            description: 'Test description',
            taskType: 0,
            reward: '1000',
            deadline: Math.floor(Date.now() / 1000) + 86400
          })
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.data.taskId).toBe('1');
      });

      it('should fail without required fields', async () => {
        const res = await request(app)
          .post('/api/tasks/create')
          .send({ title: 'Test' })
          .expect(400);
        
        expect(res.body.success).toBe(false);
      });
    });

    describe('GET /api/tasks/:taskId', () => {
      it('should get task by id', async () => {
        const mockTask = {
          id: '1',
          title: 'Test Task',
          state: '0',
          reward: '1000'
        };
        blockchain.getTask.mockResolvedValue(mockTask);

        const res = await request(app)
          .get('/api/tasks/1')
          .expect(200);
        
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe('Test Task');
      });
    });
  });
});

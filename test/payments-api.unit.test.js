/**
 * Payments API Unit Tests
 * TDD for X402 Payment endpoints
 */

const request = require('supertest');

// Set test port before importing app
process.env.PORT = '0';

// Mock blockchain service
jest.mock('../backend/services/blockchain', () => {
  const mockSigner = { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' };
  return {
    createPayment: jest.fn(),
    processPayment: jest.fn(),
    getPayment: jest.fn(),
    getSigner: jest.fn(() => mockSigner),
    contracts: {
      x402Payment: { address: '0xabc' }
    }
  };
});

const app = require('../backend/index');
const blockchain = require('../backend/services/blockchain');

describe('Payments API - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/payments/create', () => {
    it('should create a new payment', async () => {
      const mockResult = {
        paymentId: '1',
        amount: '1000000000000000000',
        payer: '0xf39F...',
        payee: '0x7099...',
        transactionHash: '0xhash',
        blockNumber: '1'
      };
      blockchain.createPayment.mockResolvedValue(mockResult);

      const res = await request(app)
        .post('/api/payments/create')
        .send({
          amount: '1000000000000000000',
          payee: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          taskId: '1'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.paymentId).toBe('1');
      expect(blockchain.createPayment).toHaveBeenCalledWith(
        '1000000000000000000',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        '1',
        expect.objectContaining({ address: expect.any(String) })
      );
    });

    it('should fail without required fields', async () => {
      const res = await request(app)
        .post('/api/payments/create')
        .send({ amount: '1000' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Missing required fields');
    });
  });

  describe('POST /api/payments/:paymentId/process', () => {
    it('should process a payment', async () => {
      const mockResult = {
        paymentId: '1',
        status: 'completed',
        transactionHash: '0xhash',
        blockNumber: '2'
      };
      blockchain.processPayment.mockResolvedValue(mockResult);

      const res = await request(app)
        .post('/api/payments/1/process')
        .send({})
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('completed');
    });
  });

  describe('GET /api/payments/:paymentId', () => {
    it('should get payment by id', async () => {
      const mockPayment = {
        id: '1',
        amount: '1000000000000000000',
        payer: '0xf39F...',
        payee: '0x7099...',
        taskId: '1',
        status: 'pending'
      };
      blockchain.getPayment.mockResolvedValue(mockPayment);

      const res = await request(app)
        .get('/api/payments/1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('1');
      expect(blockchain.getPayment).toHaveBeenCalledWith('1');
    });

    it('should return null for non-existent payment', async () => {
      blockchain.getPayment.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/payments/999')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    });
  });
});

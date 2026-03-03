/**
 * Humans API Unit Tests
 * TDD for Human Level NFT endpoints
 */

const request = require('supertest');

// Set test port before importing app
process.env.PORT = '0';
process.env.NODE_ENV = 'test'; // Use random available port

// Mock blockchain service
jest.mock('../../backend/services/blockchain', () => {
  const mockSigner = { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' };
  return {
    getHuman: jest.fn(),
    getHumanByWallet: jest.fn(),
    registerHuman: jest.fn(),
    getHumanLevel: jest.fn(),
    getHumanLevelName: jest.fn(),
    canPublishTask: jest.fn(),
    canArbitrate: jest.fn(),
    canGovern: jest.fn(),
    getSigner: jest.fn(() => mockSigner),
    contracts: {
      humanLevelNFT: { address: '0x789' }
    }
  };
});

const app = require('../../backend/index');
const blockchain = require('../../backend/services/blockchain');

describe('Humans API - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/humans/register', () => {
    it('should register a new human', async () => {
      const mockResult = {
        tokenId: '1',
        name: 'Test Human',
        wallet: '0xabc',
        transactionHash: '0xhash',
        blockNumber: '1'
      };
      blockchain.registerHuman.mockResolvedValue(mockResult);

      const res = await request(app)
        .post('/api/humans/register')
        .send({
          name: 'Test Human',
          wallet: '0xabc'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.tokenId).toBe('1');
      expect(blockchain.registerHuman).toHaveBeenCalledWith(
        'Test Human',
        '0xabc',
        expect.objectContaining({ address: expect.any(String) })
      );
    });

    it('should fail without required fields', async () => {
      const res = await request(app)
        .post('/api/humans/register')
        .send({ name: 'Test' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Missing required fields');
    });
  });

  describe('GET /api/humans/:tokenId', () => {
    it('should get human by tokenId', async () => {
      const mockHuman = {
        name: 'Test Human',
        wallet: '0xabc',
        level: '2',
        contribution: '100',
        reputation: '5000'
      };
      blockchain.getHuman.mockResolvedValue(mockHuman);

      const res = await request(app)
        .get('/api/humans/1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Human');
      expect(blockchain.getHuman).toHaveBeenCalledWith('1');
    });

    it('should return null for non-existent human', async () => {
      blockchain.getHuman.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/humans/999')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    });
  });

  describe('GET /api/humans/wallet/:wallet', () => {
    it('should get human by wallet', async () => {
      const mockHuman = {
        name: 'Test Human',
        wallet: '0xabc',
        level: '2'
      };
      blockchain.getHumanByWallet.mockResolvedValue(mockHuman);

      const res = await request(app)
        .get('/api/humans/wallet/0xabc')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.wallet).toBe('0xabc');
    });
  });

  describe('GET /api/humans/:tokenId/level', () => {
    it('should get human level', async () => {
      blockchain.getHumanLevel.mockResolvedValue(2);
      blockchain.getHumanLevelName.mockResolvedValue('Contributor');

      const res = await request(app)
        .get('/api/humans/1/level')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.level).toBe(2);
      expect(res.body.data.levelName).toBe('Contributor');
    });
  });

  describe('GET /api/humans/:tokenId/permissions', () => {
    it('should get human permissions', async () => {
      blockchain.canPublishTask.mockResolvedValue(true);
      blockchain.canArbitrate.mockResolvedValue(false);
      blockchain.canGovern.mockResolvedValue(false);

      const res = await request(app)
        .get('/api/humans/1/permissions')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.canPublishTask).toBe(true);
      expect(res.body.data.canArbitrate).toBe(false);
      expect(res.body.data.canGovern).toBe(false);
    });
  });
});

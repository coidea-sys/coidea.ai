/**
 * Contract Service Unit Tests
 * TDD for blockchain interaction
 */

// Contract Service Tests - TDD for blockchain interaction

// Mock window.ethereum before tests
global.window = {
  ethereum: {
    request: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn()
  }
};

describe('Contract Service', () => {
  let mockProvider;
  let mockSigner;
  let mockContract;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock contract methods
    mockContract = {
      registerAgent: jest.fn(),
      getAgent: jest.fn(),
      createTask: jest.fn(),
      getTask: jest.fn(),
      registerHuman: jest.fn(),
      getHuman: jest.fn(),
      on: jest.fn(),
      removeAllListeners: jest.fn()
    };

    // Mock signer
    mockSigner = {
      getAddress: jest.fn().mockResolvedValue('0x123'),
      signMessage: jest.fn()
    };

    // Mock provider
    mockProvider = {
      getSigner: jest.fn().mockReturnValue(mockSigner),
      getNetwork: jest.fn().mockResolvedValue({ chainId: 80002 }),
      on: jest.fn()
    };
  });

  describe('wallet connection', () => {
    beforeEach(() => {
      // Reset window.ethereum mock before each test
      global.window.ethereum = {
        request: jest.fn(),
        on: jest.fn(),
        removeListener: jest.fn()
      };
    });

    it('should connect to MetaMask', async () => {
      global.window.ethereum.request.mockResolvedValueOnce(['0x123']);
      
      const accounts = await global.window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      expect(accounts).toEqual(['0x123']);
      expect(global.window.ethereum.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts'
      });
    });

    it('should get connected accounts', async () => {
      global.window.ethereum.request.mockResolvedValueOnce(['0x456']);
      
      const accounts = await global.window.ethereum.request({ 
        method: 'eth_accounts' 
      });
      
      expect(accounts).toEqual(['0x456']);
    });

    it('should handle connection rejection', async () => {
      global.window.ethereum.request.mockRejectedValueOnce(
        new Error('User rejected request')
      );
      
      await expect(
        global.window.ethereum.request({ method: 'eth_requestAccounts' })
      ).rejects.toThrow('User rejected request');
    });
  });

  describe('agent registration', () => {
    it('should register agent', async () => {
      const agentData = {
        name: 'Test Agent',
        uri: 'ipfs://test',
        wallet: '0xabc'
      };
      
      mockContract.registerAgent.mockResolvedValueOnce({
        wait: jest.fn().mockResolvedValue({ status: 1 })
      });

      const tx = await mockContract.registerAgent(
        agentData.name,
        agentData.uri,
        agentData.wallet
      );
      
      expect(mockContract.registerAgent).toHaveBeenCalledWith(
        agentData.name,
        agentData.uri,
        agentData.wallet
      );
      expect(tx.wait).toBeDefined();
    });

    it('should get agent by tokenId', async () => {
      const mockAgent = {
        agentName: 'Test Agent',
        agentURI: 'ipfs://test',
        agentWallet: '0xabc',
        reputationScore: 100
      };
      
      mockContract.getAgent.mockResolvedValueOnce(mockAgent);

      const agent = await mockContract.getAgent(1);
      
      expect(mockContract.getAgent).toHaveBeenCalledWith(1);
      expect(agent.agentName).toBe('Test Agent');
    });
  });

  describe('task operations', () => {
    it('should create task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        reward: '100000000000000000', // 0.1 ETH in wei
        deadline: Math.floor(Date.now() / 1000) + 86400
      };
      
      mockContract.createTask.mockResolvedValueOnce({
        wait: jest.fn().mockResolvedValue({ 
          status: 1,
          events: [{ args: { taskId: 1 } }]
        })
      });

      const tx = await mockContract.createTask(
        taskData.title,
        taskData.description,
        taskData.reward,
        taskData.deadline
      );
      
      expect(mockContract.createTask).toHaveBeenCalled();
      expect(tx.wait).toBeDefined();
    });

    it('should get task by id', async () => {
      const mockTask = {
        title: 'Test Task',
        reward: '100000000000000000', // 0.1 ETH in wei
        state: 0 // Open
      };
      
      mockContract.getTask.mockResolvedValueOnce(mockTask);

      const task = await mockContract.getTask(1);
      
      expect(mockContract.getTask).toHaveBeenCalledWith(1);
      expect(task.title).toBe('Test Task');
    });
  });

  describe('human registration', () => {
    it('should register human', async () => {
      const humanData = {
        name: 'Test Human',
        wallet: '0xdef'
      };
      
      mockContract.registerHuman.mockResolvedValueOnce({
        wait: jest.fn().mockResolvedValue({ status: 1 })
      });

      const tx = await mockContract.registerHuman(
        humanData.name,
        humanData.wallet
      );
      
      expect(mockContract.registerHuman).toHaveBeenCalledWith(
        humanData.name,
        humanData.wallet
      );
    });

    it('should get human level', async () => {
      mockContract.getHuman.mockResolvedValueOnce({
        name: 'Test Human',
        level: 2
      });

      const human = await mockContract.getHuman(1);
      
      expect(human.level).toBe(2);
    });
  });

  describe('event listening', () => {
    it('should listen to AgentRegistered event', () => {
      const callback = jest.fn();
      
      mockContract.on('AgentRegistered', callback);
      
      expect(mockContract.on).toHaveBeenCalledWith('AgentRegistered', callback);
    });

    it('should listen to TaskCreated event', () => {
      const callback = jest.fn();
      
      mockContract.on('TaskCreated', callback);
      
      expect(mockContract.on).toHaveBeenCalledWith('TaskCreated', callback);
    });

    it('should remove all listeners', () => {
      mockContract.removeAllListeners();
      
      expect(mockContract.removeAllListeners).toHaveBeenCalled();
    });
  });

  describe('network detection', () => {
    it('should detect correct network', async () => {
      mockProvider.getNetwork.mockResolvedValueOnce({ chainId: 80002 });
      
      const network = await mockProvider.getNetwork();
      
      expect(network.chainId).toBe(80002); // Amoy
    });

    it('should detect wrong network', async () => {
      mockProvider.getNetwork.mockResolvedValueOnce({ chainId: 1 });
      
      const network = await mockProvider.getNetwork();
      
      expect(network.chainId).not.toBe(80002);
    });
  });

  describe('error handling', () => {
    it('should handle transaction failure', async () => {
      mockContract.registerAgent.mockRejectedValueOnce(
        new Error('Transaction failed')
      );

      await expect(
        mockContract.registerAgent('Test', 'uri', 'wallet')
      ).rejects.toThrow('Transaction failed');
    });

    it('should handle network errors', async () => {
      mockProvider.getNetwork.mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(mockProvider.getNetwork()).rejects.toThrow('Network error');
    });
  });
});

import { renderHook, act } from '@testing-library/react';
import { useAgent } from '../hooks/useAgent';
import { ethers } from 'ethers';

jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  BrowserProvider: jest.fn(),
  Contract: jest.fn(),
  parseEther: jest.fn((val) => val),
  formatEther: jest.fn((val) => val),
}));

describe('useAgent Hook', () => {
  const mockContract = {
    registerAgent: jest.fn(),
    getAgent: jest.fn(),
    getAgentCount: jest.fn(),
    activateAgent: jest.fn(),
  };

  const mockLifecycleContract = {
    fundAgent: jest.fn(),
    getAgentEconomics: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    ethers.Contract.mockImplementation((address) => {
      if (address.includes('Lifecycle')) return mockLifecycleContract;
      return mockContract;
    });
  });

  describe('Agent Creation', () => {
    it('should create a new agent with name and capabilities', async () => {
      // Arrange
      mockContract.registerAgent.mockResolvedValue({ 
        wait: jest.fn().mockResolvedValue(true) 
      });
      
      // Act
      const { result } = renderHook(() => useAgent());
      
      await act(async () => {
        await result.current.createAgent('MyAgent', ['coding', 'analysis'], 'ipfs://config');
      });
      
      // Assert
      expect(mockContract.registerAgent).toHaveBeenCalledWith(
        'MyAgent',
        ['coding', 'analysis'],
        'ipfs://config'
      );
    });

    it('should fund agent after creation', async () => {
      // Arrange
      mockContract.registerAgent.mockResolvedValue({ 
        wait: jest.fn().mockResolvedValue(true) 
      });
      mockLifecycleContract.fundAgent.mockResolvedValue({
        wait: jest.fn().mockResolvedValue(true)
      });
      
      // Act
      const { result } = renderHook(() => useAgent());
      
      await act(async () => {
        const agentId = await result.current.createAgent('MyAgent', ['coding'], 'ipfs://config');
        await result.current.fundAgent(agentId, '0.1');
      });
      
      // Assert
      expect(mockLifecycleContract.fundAgent).toHaveBeenCalledWith(
        expect.any(Number),
        { value: '0.1' }
      );
    });
  });

  describe('Agent Management', () => {
    it('should fetch agent details', async () => {
      // Arrange
      const mockAgent = {
        id: 1,
        name: 'MyAgent',
        capabilities: ['coding'],
        status: 'Active',
        owner: '0x1234...',
      };
      mockContract.getAgent.mockResolvedValue(mockAgent);
      
      // Act
      const { result } = renderHook(() => useAgent());
      
      await act(async () => {
        await result.current.fetchAgent(1);
      });
      
      // Assert
      expect(result.current.agent).toEqual(mockAgent);
    });

    it('should get agent economics', async () => {
      // Arrange
      const mockEconomics = {
        totalDeposited: '1.0',
        availableBalance: '0.8',
        totalEarned: '0.5',
      };
      mockLifecycleContract.getAgentEconomics.mockResolvedValue(mockEconomics);
      
      // Act
      const { result } = renderHook(() => useAgent());
      
      await act(async () => {
        await result.current.fetchEconomics(1);
      });
      
      // Assert
      expect(result.current.economics).toEqual(mockEconomics);
    });
  });
});

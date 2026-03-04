import { renderHook, act } from '@testing-library/react';
import { useHuman } from '../hooks/useHuman';
import { ethers } from 'ethers';

// Mock ethers
jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  BrowserProvider: jest.fn(),
  Contract: jest.fn(),
  parseEther: jest.fn((val) => val),
  formatEther: jest.fn((val) => val),
}));

describe('useHuman Hook', () => {
  const mockProvider = {
    getSigner: jest.fn(),
  };

  const mockSigner = {
    getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
  };

  const mockContract = {
    register: jest.fn(),
    humans: jest.fn(),
    isHuman: jest.fn(),
    getHumanProfile: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockProvider.getSigner.mockResolvedValue(mockSigner);
    ethers.BrowserProvider.mockImplementation(() => mockProvider);
    ethers.Contract.mockImplementation(() => mockContract);
  });

  describe('Registration', () => {
    it('should register a new human with username and metadata', async () => {
      // Arrange
      mockContract.register.mockResolvedValue({ wait: jest.fn().mockResolvedValue(true) });
      
      // Act
      const { result } = renderHook(() => useHuman());
      
      await act(async () => {
        await result.current.register('testuser', 'ipfs://metadata');
      });
      
      // Assert
      expect(mockContract.register).toHaveBeenCalledWith(
        'testuser',
        'ipfs://metadata',
        { value: '0.001' }
      );
      expect(result.current.isRegistered).toBe(true);
    });

    it('should handle registration errors', async () => {
      // Arrange
      mockContract.register.mockRejectedValue(new Error('Username taken'));
      
      // Act
      const { result } = renderHook(() => useHuman());
      
      await act(async () => {
        try {
          await result.current.register('existinguser', 'ipfs://metadata');
        } catch (e) {
          // Expected error
        }
      });
      
      // Assert
      expect(result.current.error).toBe('Username taken');
      expect(result.current.isRegistered).toBe(false);
    });

    it('should check if user is already registered', async () => {
      // Arrange
      mockContract.isHuman.mockResolvedValue(true);
      
      // Act
      const { result } = renderHook(() => useHuman());
      
      await act(async () => {
        await result.current.checkRegistration();
      });
      
      // Assert
      expect(result.current.isRegistered).toBe(true);
    });
  });

  describe('Profile Management', () => {
    it('should fetch human profile', async () => {
      // Arrange
      const mockProfile = {
        wallet: '0x1234567890123456789012345678901234567890',
        username: 'testuser',
        metadataURI: 'ipfs://metadata',
        registeredAt: 1234567890,
        reputation: 100,
        isVerified: true,
        isActive: true,
      };
      mockContract.getHumanProfile.mockResolvedValue(mockProfile);
      
      // Act
      const { result } = renderHook(() => useHuman());
      
      await act(async () => {
        await result.current.fetchProfile();
      });
      
      // Assert
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.profile.username).toBe('testuser');
    });
  });

  describe('Loading States', () => {
    it('should show loading state during registration', async () => {
      // Arrange
      mockContract.register.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ wait: jest.fn() }), 100))
      );
      
      // Act
      const { result } = renderHook(() => useHuman());
      
      act(() => {
        result.current.register('testuser', 'ipfs://metadata');
      });
      
      // Assert - immediately after calling
      expect(result.current.isLoading).toBe(true);
    });
  });
});

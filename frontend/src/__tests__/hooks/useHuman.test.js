import { renderHook, act, waitFor } from '@testing-library/react';
import { useHuman } from '../hooks/useHuman';
import { ethers } from 'ethers';

// Mock ethers
jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  BrowserProvider: jest.fn(),
  Contract: jest.fn(),
}));

describe('useHuman Hook', () => {
  const mockProvider = {
    getSigner: jest.fn(),
  };

  const mockSigner = {
    getAddress: jest.fn().mockResolvedValue('0x123'),
  };

  const mockContract = {
    registrationFee: jest.fn().mockResolvedValue(ethers.parseEther('0.001')),
    register: jest.fn().mockResolvedValue({ wait: jest.fn() }),
    getHumanProfile: jest.fn(),
    isHuman: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    ethers.BrowserProvider.mockImplementation(() => mockProvider);
    ethers.Contract.mockImplementation(() => mockContract);
    mockProvider.getSigner.mockResolvedValue(mockSigner);
  });

  describe('Registration', () => {
    it('should get registration fee', async () => {
      const { result } = renderHook(() => useHuman());

      await act(async () => {
        await result.current.getRegistrationFee();
      });

      expect(mockContract.registrationFee).toHaveBeenCalled();
      expect(result.current.registrationFee).toBe('0.001');
    });

    it('should register human successfully', async () => {
      const { result } = renderHook(() => useHuman());

      let success = false;
      await act(async () => {
        success = await result.current.register('testuser', 'ipfs://test');
      });

      expect(success).toBe(true);
      expect(mockContract.register).toHaveBeenCalledWith(
        'testuser',
        'ipfs://test',
        { value: ethers.parseEther('0.001') }
      );
    });

    it('should handle registration error', async () => {
      mockContract.register.mockRejectedValue(new Error('Username taken'));
      
      const { result } = renderHook(() => useHuman());

      let error = null;
      await act(async () => {
        try {
          await result.current.register('testuser', 'ipfs://test');
        } catch (e) {
          error = e.message;
        }
      });

      expect(error).toBe('Username taken');
    });
  });

  describe('Profile', () => {
    it('should fetch human profile', async () => {
      const mockProfile = {
        wallet: '0x123',
        username: 'testuser',
        reputation: 100,
        totalTasksCreated: 5,
        isVerified: true,
      };
      mockContract.getHumanProfile.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useHuman());

      await act(async () => {
        await result.current.fetchProfile('0x123');
      });

      expect(mockContract.getHumanProfile).toHaveBeenCalledWith('0x123');
      expect(result.current.profile).toEqual(mockProfile);
    });

    it('should check if address is human', async () => {
      mockContract.isHuman.mockResolvedValue(true);

      const { result } = renderHook(() => useHuman());

      let isHuman = false;
      await act(async () => {
        isHuman = await result.current.checkIsHuman('0x123');
      });

      expect(isHuman).toBe(true);
    });
  });

  describe('Loading States', () => {
    it('should set loading during registration', async () => {
      const { result } = renderHook(() => useHuman());

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.register('testuser', 'ipfs://test');
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});

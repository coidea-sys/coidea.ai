import { renderHook, act, waitFor } from '@testing-library/react';
import { useWallet } from '../hooks/useWallet';
import { ethers } from 'ethers';

jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  BrowserProvider: jest.fn(),
  Contract: jest.fn(),
}));

describe('useWallet Hook', () => {
  const mockProvider = {
    getSigner: jest.fn(),
    getBalance: jest.fn(),
  };

  const mockSigner = {
    getAddress: jest.fn().mockResolvedValue('0x123'),
  };

  const mockContract = {
    deposit: jest.fn().mockResolvedValue({ wait: jest.fn() }),
    withdraw: jest.fn().mockResolvedValue({ wait: jest.fn() }),
    getWalletSummary: jest.fn(),
    getInvestments: jest.fn().mockResolvedValue([]),
    getRevenueHistory: jest.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    ethers.BrowserProvider.mockImplementation(() => mockProvider);
    ethers.Contract.mockImplementation(() => mockContract);
    mockProvider.getSigner.mockResolvedValue(mockSigner);
    mockProvider.getBalance.mockResolvedValue(ethers.parseEther('1.5'));
  });

  describe('Deposit', () => {
    it('should deposit funds successfully', async () => {
      const { result } = renderHook(() => useWallet());

      const depositAmount = '0.5';
      let success = false;

      await act(async () => {
        success = await result.current.deposit(depositAmount);
      });

      expect(success).toBe(true);
      expect(mockContract.deposit).toHaveBeenCalledWith({
        value: ethers.parseEther('0.5'),
      });
    });

    it('should handle deposit error', async () => {
      mockContract.deposit.mockRejectedValue(new Error('Insufficient balance'));
      
      const { result } = renderHook(() => useWallet());

      let error = null;
      await act(async () => {
        try {
          await result.current.deposit('0.5');
        } catch (e) {
          error = e.message;
        }
      });

      expect(error).toBe('Insufficient balance');
    });
  });

  describe('Withdraw', () => {
    it('should withdraw funds successfully', async () => {
      const { result } = renderHook(() => useWallet());

      const withdrawAmount = '0.3';
      let success = false;

      await act(async () => {
        success = await result.current.withdraw(withdrawAmount);
      });

      expect(success).toBe(true);
      expect(mockContract.withdraw).toHaveBeenCalledWith(ethers.parseEther('0.3'));
    });
  });

  describe('Wallet Summary', () => {
    it('should fetch wallet summary', async () => {
      const mockSummary = {
        available: ethers.parseEther('0.8'),
        lockedInTasks: ethers.parseEther('0.1'),
        investedInAgents: ethers.parseEther('0.2'),
        totalValue: ethers.parseEther('1.1'),
      };
      mockContract.getWalletSummary.mockResolvedValue(mockSummary);

      const { result } = renderHook(() => useWallet());

      await act(async () => {
        await result.current.fetchWalletSummary();
      });

      expect(result.current.walletSummary).toEqual({
        available: '0.8',
        lockedInTasks: '0.1',
        investedInAgents: '0.2',
        totalValue: '1.1',
      });
    });
  });

  describe('Native Balance', () => {
    it('should fetch native MATIC balance', async () => {
      const { result } = renderHook(() => useWallet());

      await act(async () => {
        await result.current.fetchNativeBalance('0x123');
      });

      expect(result.current.nativeBalance).toBe('1.5');
    });
  });

  describe('Loading States', () => {
    it('should set loading during deposit', async () => {
      const { result } = renderHook(() => useWallet());

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.deposit('0.5');
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});

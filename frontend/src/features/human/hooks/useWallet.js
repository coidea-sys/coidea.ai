import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContractAddress } from '../../../config/network';
import HumanEconomyABI from '../../../abis/HumanEconomy.json';

export function useWallet() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getContract = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contractAddress = getContractAddress('HumanEconomy');
    
    return new ethers.Contract(contractAddress, HumanEconomyABI, signer);
  }, []);

  const deposit = useCallback(async (amount) => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = await getContract();
      const value = ethers.parseEther(amount);
      
      const tx = await contract.deposit({ value });
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      return receipt;
    } catch (err) {
      setError(err.message || 'Deposit failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const withdraw = useCallback(async (amount) => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = await getContract();
      const value = ethers.parseEther(amount);
      
      const tx = await contract.withdraw(value);
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      return receipt;
    } catch (err) {
      setError(err.message || 'Withdrawal failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const getBalance = useCallback(async (address) => {
    try {
      const contract = await getContract();
      const wallet = await contract.humanWallets(address);

      return {
        available: ethers.formatEther(wallet.availableBalance),
        locked: ethers.formatEther(wallet.lockedInTasks),
        invested: ethers.formatEther(wallet.investedInAgents),
        totalDeposited: ethers.formatEther(wallet.totalDeposited),
        totalWithdrawn: ethers.formatEther(wallet.totalWithdrawn),
      };
    } catch (err) {
      console.error('Failed to get balance:', err);
      return {
        available: '0',
        locked: '0',
        invested: '0',
        totalDeposited: '0',
        totalWithdrawn: '0',
      };
    }
  }, [getContract]);

  return {
    deposit,
    withdraw,
    getBalance,
    isLoading,
    error,
  };
}

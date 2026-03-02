import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContractAddress } from '../config/network';
import HumanEconomyABI from '../abis/HumanEconomy.json';

export const useWallet = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [walletSummary, setWalletSummary] = useState(null);
  const [nativeBalance, setNativeBalance] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [revenueHistory, setRevenueHistory] = useState([]);

  const getContract = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contractAddress = getContractAddress('HumanEconomy');
    
    if (!contractAddress) {
      throw new Error('HumanEconomy contract not deployed');
    }

    return new ethers.Contract(contractAddress, HumanEconomyABI, signer);
  }, []);

  const getProvider = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }
    return new ethers.BrowserProvider(window.ethereum);
  }, []);

  const deposit = useCallback(async (amount) => {
    try {
      setLoading(true);
      setError(null);

      const contract = await getContract();
      const value = ethers.parseEther(amount);

      const tx = await contract.deposit({ value });
      await tx.wait();

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  const withdraw = useCallback(async (amount) => {
    try {
      setLoading(true);
      setError(null);

      const contract = await getContract();
      const value = ethers.parseEther(amount);

      const tx = await contract.withdraw(value);
      await tx.wait();

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  const fetchWalletSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const contract = await getContract();
      const signer = await (await getProvider()).getSigner();
      const address = await signer.getAddress();

      const summary = await contract.getWalletSummary(address);
      
      setWalletSummary({
        available: ethers.formatEther(summary.available),
        lockedInTasks: ethers.formatEther(summary.lockedInTasks),
        investedInAgents: ethers.formatEther(summary.investedInAgents),
        totalValue: ethers.formatEther(summary.totalValue),
      });

      return summary;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract, getProvider]);

  const fetchNativeBalance = useCallback(async (address) => {
    try {
      const provider = await getProvider();
      const balance = await provider.getBalance(address);
      setNativeBalance(ethers.formatEther(balance));
      return ethers.formatEther(balance);
    } catch (err) {
      setError(err.message);
      return '0';
    }
  }, [getProvider]);

  const fetchInvestments = useCallback(async () => {
    try {
      const contract = await getContract();
      const signer = await (await getProvider()).getSigner();
      const address = await signer.getAddress();

      const invs = await contract.getInvestments(address);
      setInvestments(invs);
      return invs;
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, [getContract, getProvider]);

  const fetchRevenueHistory = useCallback(async () => {
    try {
      const contract = await getContract();
      const signer = await (await getProvider()).getSigner();
      const address = await signer.getAddress();

      const history = await contract.getRevenueHistory(address);
      setRevenueHistory(history);
      return history;
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, [getContract, getProvider]);

  return {
    loading,
    error,
    walletSummary,
    nativeBalance,
    investments,
    revenueHistory,
    deposit,
    withdraw,
    fetchWalletSummary,
    fetchNativeBalance,
    fetchInvestments,
    fetchRevenueHistory,
  };
};

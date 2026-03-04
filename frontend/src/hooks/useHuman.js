import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContractAddress } from '../config/network';

const ABI = [
  "function register(string _username, string _metadataURI) payable",
  "function isHuman(address _wallet) view returns (bool)",
  "function getHumanProfile(address _wallet) view returns (tuple(address wallet, string username, string metadataURI, uint256 registeredAt, uint256 reputation, uint256 totalTasksCreated, uint256 totalTasksCompleted, uint256 totalSpent, uint256 totalEarned, bool isVerified, bool isActive))",
  "function humans(address) view returns (address wallet, string username, string metadataURI, uint256 registeredAt, uint256 reputation, uint256 totalTasksCreated, uint256 totalTasksCompleted, uint256 totalSpent, uint256 totalEarned, bool isVerified, bool isActive)"
];

export function useHuman() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [profile, setProfile] = useState(null);

  const getContract = useCallback(async () => {
    if (!window.ethereum) throw new Error('MetaMask not installed');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = getContractAddress('HumanRegistry');
    return new ethers.Contract(address, ABI, signer);
  }, []);

  const register = useCallback(async (username, metadataURI) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const contract = await getContract();
      const tx = await contract.register(username, metadataURI, {
        value: ethers.parseEther('0.001')
      });
      await tx.wait();
      setIsRegistered(true);
      return true;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const checkRegistration = useCallback(async () => {
    try {
      const contract = await getContract();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const registered = await contract.isHuman(address);
      setIsRegistered(registered);
      return registered;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [getContract]);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const contract = await getContract();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const profile = await contract.humans(address);
      setProfile({
        wallet: profile.wallet,
        username: profile.username,
        metadataURI: profile.metadataURI,
        registeredAt: Number(profile.registeredAt),
        reputation: Number(profile.reputation),
        totalTasksCreated: Number(profile.totalTasksCreated),
        totalTasksCompleted: Number(profile.totalTasksCompleted),
        totalSpent: ethers.formatEther(profile.totalSpent),
        totalEarned: ethers.formatEther(profile.totalEarned),
        isVerified: profile.isVerified,
        isActive: profile.isActive,
      });
      return profile;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  return {
    register,
    checkRegistration,
    fetchProfile,
    isLoading,
    error,
    isRegistered,
    profile,
  };
}

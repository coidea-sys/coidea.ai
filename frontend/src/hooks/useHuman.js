import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContractAddress } from '../config/network';
import HumanRegistryABI from '../abis/HumanRegistry.json';

export const useHuman = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [registrationFee, setRegistrationFee] = useState(null);

  const getContract = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contractAddress = getContractAddress('HumanRegistry');
    
    if (!contractAddress) {
      throw new Error('HumanRegistry contract not deployed');
    }

    return new ethers.Contract(contractAddress, HumanRegistryABI, signer);
  }, []);

  const getRegistrationFee = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const contract = await getContract();
      const fee = await contract.registrationFee();
      const feeInEth = ethers.formatEther(fee);
      
      setRegistrationFee(feeInEth);
      return feeInEth;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  const register = useCallback(async (username, metadataURI) => {
    try {
      setLoading(true);
      setError(null);

      const contract = await getContract();
      const fee = await contract.registrationFee();

      const tx = await contract.register(username, metadataURI, {
        value: fee
      });

      await tx.wait();
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  const fetchProfile = useCallback(async (address) => {
    try {
      setLoading(true);
      setError(null);

      const contract = await getContract();
      const profile = await contract.getHumanProfile(address);
      
      setProfile({
        wallet: profile.wallet,
        username: profile.username,
        metadataURI: profile.metadataURI,
        registeredAt: Number(profile.registeredAt) * 1000,
        reputation: Number(profile.reputation),
        totalTasksCreated: Number(profile.totalTasksCreated),
        totalTasksCompleted: Number(profile.totalTasksCompleted),
        isVerified: profile.isVerified,
        isActive: profile.isActive,
      });

      return profile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  const checkIsHuman = useCallback(async (address) => {
    try {
      const contract = await getContract();
      return await contract.isHuman(address);
    } catch (err) {
      return false;
    }
  }, [getContract]);

  return {
    loading,
    error,
    profile,
    registrationFee,
    getRegistrationFee,
    register,
    fetchProfile,
    checkIsHuman,
  };
};

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContractAddress } from '../../../config/network';
import HumanRegistryABI from '../../../abis/HumanRegistry.json';

const REGISTRATION_FEE = ethers.parseEther('0.001');

export function useHuman() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getContract = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contractAddress = getContractAddress('HumanRegistry');
    
    return new ethers.Contract(contractAddress, HumanRegistryABI, signer);
  }, []);

  const register = useCallback(async (username, metadataURI, options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = await getContract();
      const tx = await contract.register(username, metadataURI, {
        value: options.value || REGISTRATION_FEE,
      });

      const receipt = await tx.wait();
      
      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      return receipt;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const getHuman = useCallback(async (address) => {
    try {
      const contract = await getContract();
      const profile = await contract.humans(address);

      // Check if human exists
      if (profile.wallet === ethers.ZeroAddress || !profile.isActive) {
        return null;
      }

      return {
        wallet: profile.wallet,
        username: profile.username,
        metadataURI: profile.metadataURI,
        registeredAt: profile.registeredAt,
        reputation: profile.reputation,
        isActive: profile.isActive,
      };
    } catch (err) {
      console.error('Failed to get human:', err);
      return null;
    }
  }, [getContract]);

  const checkIsHuman = useCallback(async (address) => {
    try {
      const contract = await getContract();
      return await contract.isHuman(address);
    } catch (err) {
      console.error('Failed to check human status:', err);
      return false;
    }
  }, [getContract]);

  const updateProfile = useCallback(async (metadataURI) => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = await getContract();
      const tx = await contract.updateProfile(metadataURI);
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      return receipt;
    } catch (err) {
      setError(err.message || 'Update failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  return {
    register,
    getHuman,
    checkIsHuman,
    updateProfile,
    isLoading,
    error,
    REGISTRATION_FEE,
  };
}

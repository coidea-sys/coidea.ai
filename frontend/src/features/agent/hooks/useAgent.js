import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContractAddress } from '../../../config/network';
import AIAgentRegistryABI from '../../../abis/AIAgentRegistry.json';

export function useAgent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getContract = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contractAddress = getContractAddress('AIAgentRegistry');
    
    return new ethers.Contract(contractAddress, AIAgentRegistryABI, signer);
  }, []);

  const createAgent = useCallback(async (name, skills, configURI) => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = await getContract();
      const tx = await contract.registerAgent(name, skills, configURI);
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      // Get agent ID from event
      const event = receipt.logs.find(
        log => log.fragment?.name === 'AgentRegistered'
      );
      const agentId = event?.args?.agentId;

      return { receipt, agentId };
    } catch (err) {
      setError(err.message || 'Failed to create agent');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const getAgent = useCallback(async (agentId) => {
    try {
      const contract = await getContract();
      const agent = await contract.agents(agentId);
      const skills = await contract.getAgentSkills(agentId);

      return {
        id: agentId,
        name: agent.name,
        owner: agent.owner,
        skills: skills,
        configURI: agent.configURI,
        reputation: agent.reputation,
        isActive: agent.isActive,
        createdAt: agent.createdAt,
      };
    } catch (err) {
      console.error('Failed to get agent:', err);
      return null;
    }
  }, [getContract]);

  const getMyAgents = useCallback(async (ownerAddress) => {
    try {
      const contract = await getContract();
      const agentIds = await contract.getAgentsByOwner(ownerAddress);
      
      const agents = await Promise.all(
        agentIds.map(id => getAgent(Number(id)))
      );
      
      return agents.filter(Boolean);
    } catch (err) {
      console.error('Failed to get my agents:', err);
      return [];
    }
  }, [getContract, getAgent]);

  const isAgentOwner = useCallback(async (agentId, address) => {
    try {
      const contract = await getContract();
      return await contract.isAgentOwner(agentId, address);
    } catch (err) {
      console.error('Failed to check ownership:', err);
      return false;
    }
  }, [getContract]);

  return {
    createAgent,
    getAgent,
    getMyAgents,
    isAgentOwner,
    isLoading,
    error,
  };
}

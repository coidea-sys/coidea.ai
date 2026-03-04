import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContractAddress } from '../config/network';

const AGENT_ABI = [
  "function registerAgent(string _name, string[] _capabilities, string _metadataURI)",
  "function getAgent(uint256 _agentId) view returns (tuple(uint256 id, string name, address owner, string[] capabilities, string metadataURI, uint256 createdAt, bool isActive))",
  "function getAgentCount() view returns (uint256)",
  "function activateAgent(uint256 _agentId)"
];

const LIFECYCLE_ABI = [
  "function fundAgent(uint256 _agentId) payable",
  "function getAgentEconomics(uint256 _agentId) view returns (tuple(uint256 totalDeposited, uint256 availableBalance, uint256 lockedBalance, uint256 totalEarned, uint256 totalSpent, uint256 lastActivityTime, uint256 dailyCostEstimate, uint256 sustainabilityScore))"
];

export function useAgent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agent, setAgent] = useState(null);
  const [economics, setEconomics] = useState(null);

  const getAgentContract = useCallback(async () => {
    if (!window.ethereum) throw new Error('MetaMask not installed');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = getContractAddress('AIAgentRegistry');
    return new ethers.Contract(address, AGENT_ABI, signer);
  }, []);

  const getLifecycleContract = useCallback(async () => {
    if (!window.ethereum) throw new Error('MetaMask not installed');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = getContractAddress('AgentLifecycle');
    return new ethers.Contract(address, LIFECYCLE_ABI, signer);
  }, []);

  const createAgent = useCallback(async (name, capabilities, metadataURI) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const contract = await getAgentContract();
      const tx = await contract.registerAgent(name, capabilities, metadataURI);
      const receipt = await tx.wait();
      
      // Get agent count to determine new agent ID
      const count = await contract.getAgentCount();
      return Number(count) - 1;
    } catch (err) {
      setError(err.message || 'Agent creation failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getAgentContract]);

  const fundAgent = useCallback(async (agentId, amount) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const contract = await getLifecycleContract();
      const tx = await contract.fundAgent(agentId, {
        value: ethers.parseEther(amount)
      });
      await tx.wait();
      return true;
    } catch (err) {
      setError(err.message || 'Funding failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getLifecycleContract]);

  const fetchAgent = useCallback(async (agentId) => {
    setIsLoading(true);
    try {
      const contract = await getAgentContract();
      const agent = await contract.getAgent(agentId);
      setAgent({
        id: Number(agent.id),
        name: agent.name,
        owner: agent.owner,
        capabilities: agent.capabilities,
        metadataURI: agent.metadataURI,
        createdAt: Number(agent.createdAt),
        isActive: agent.isActive,
      });
      return agent;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getAgentContract]);

  const fetchEconomics = useCallback(async (agentId) => {
    setIsLoading(true);
    try {
      const contract = await getLifecycleContract();
      const econ = await contract.getAgentEconomics(agentId);
      setEconomics({
        totalDeposited: ethers.formatEther(econ.totalDeposited),
        availableBalance: ethers.formatEther(econ.availableBalance),
        lockedBalance: ethers.formatEther(econ.lockedBalance),
        totalEarned: ethers.formatEther(econ.totalEarned),
        totalSpent: ethers.formatEther(econ.totalSpent),
        lastActivityTime: Number(econ.lastActivityTime),
        dailyCostEstimate: ethers.formatEther(econ.dailyCostEstimate),
        sustainabilityScore: Number(econ.sustainabilityScore),
      });
      return econ;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getLifecycleContract]);

  return {
    createAgent,
    fundAgent,
    fetchAgent,
    fetchEconomics,
    isLoading,
    error,
    agent,
    economics,
  };
}

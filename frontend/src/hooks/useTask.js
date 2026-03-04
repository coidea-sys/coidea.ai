import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContractAddress } from '../config/network';

const ABI = [
  "function createTask(string _title, string _description, uint8 _taskType, uint256 _reward, uint256 _deadlineDuration, string[] _requiredSkills, uint256 _minReputation, bool _isMultiAgent) payable returns (uint256)",
  "function getTask(uint256 _taskId) view returns (tuple(uint256 id, string title, string description, uint8 taskType, uint8 state, address publisher, address worker, uint256 reward, uint256 deadline, uint256 createdAt))",
  "function applyForTask(uint256 _taskId, string _proposal, uint256 _proposedPrice)",
  "function submitTask(uint256 _taskId, string _deliverableURI)",
  "function completeTask(uint256 _taskId)",
  "function taskCounter() view returns (uint256)"
];

export function useTask() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [taskCount, setTaskCount] = useState(0);

  const getContract = useCallback(async () => {
    if (!window.ethereum) throw new Error('MetaMask not installed');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = getContractAddress('TaskRegistry');
    return new ethers.Contract(address, ABI, signer);
  }, []);

  const createTask = useCallback(async ({ title, description, reward, deadline, taskType = 0, requiredSkills = [], minReputation = 0, isMultiAgent = false }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate minimum reward
      if (parseFloat(reward) < 0.001) {
        throw new Error('Reward must be at least 0.001 ETH');
      }
      
      const contract = await getContract();
      const deadlineSeconds = deadline * 24 * 60 * 60; // Convert days to seconds
      
      const tx = await contract.createTask(
        title,
        description,
        taskType,
        ethers.parseEther(reward),
        deadlineSeconds,
        requiredSkills,
        minReputation,
        isMultiAgent,
        { value: ethers.parseEther(reward) }
      );
      
      const receipt = await tx.wait();
      return receipt;
    } catch (err) {
      setError(err.message || 'Task creation failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const applyForTask = useCallback(async (taskId, proposal, proposedPrice) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const contract = await getContract();
      const tx = await contract.applyForTask(taskId, proposal, ethers.parseEther(proposedPrice));
      await tx.wait();
      return true;
    } catch (err) {
      setError(err.message || 'Application failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const submitTask = useCallback(async (taskId, deliverableURI) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const contract = await getContract();
      const tx = await contract.submitTask(taskId, deliverableURI);
      await tx.wait();
      return true;
    } catch (err) {
      setError(err.message || 'Submission failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const completeTask = useCallback(async (taskId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const contract = await getContract();
      const tx = await contract.completeTask(taskId);
      await tx.wait();
      return true;
    } catch (err) {
      setError(err.message || 'Completion failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const contract = await getContract();
      const count = await contract.taskCounter();
      setTaskCount(Number(count));
      return Number(count);
    } catch (err) {
      setError(err.message);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  return {
    createTask,
    applyForTask,
    submitTask,
    completeTask,
    fetchTasks,
    isLoading,
    error,
    taskCount,
  };
}

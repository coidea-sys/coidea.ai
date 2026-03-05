import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContractAddress } from '../../../config/network';
import TaskRegistryABI from '../../../abis/TaskRegistry.json';

export function useTask() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getContract = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contractAddress = getContractAddress('TaskRegistry');
    
    return new ethers.Contract(contractAddress, TaskRegistryABI, signer);
  }, []);

  const createTask = useCallback(async (title, description, taskType, reward, deadlineDuration, skills) => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = await getContract();
      const rewardWei = ethers.parseEther(reward);
      
      const tx = await contract.createTask(
        title,
        description,
        taskType,
        rewardWei,
        deadlineDuration,
        skills,
        0, // minReputation
        false // isMultiAgent
      );
      
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      const event = receipt.logs.find(log => log.fragment?.name === 'TaskCreated');
      const taskId = event?.args?.taskId;

      return { receipt, taskId };
    } catch (err) {
      setError(err.message || 'Failed to create task');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const getTask = useCallback(async (taskId) => {
    try {
      const contract = await getContract();
      const task = await contract.tasks(taskId);

      return {
        id: taskId,
        title: task.title,
        description: task.description,
        taskType: task.taskType,
        state: task.state,
        publisher: task.publisher,
        worker: task.worker,
        reward: ethers.formatEther(task.reward),
        createdAt: task.createdAt,
        deadline: task.deadline,
      };
    } catch (err) {
      console.error('Failed to get task:', err);
      return null;
    }
  }, [getContract]);

  const getAllTasks = useCallback(async () => {
    try {
      const contract = await getContract();
      const taskIds = await contract.getAllTasks();
      
      const tasks = await Promise.all(
        taskIds.map(id => getTask(Number(id)))
      );
      
      return tasks.filter(Boolean);
    } catch (err) {
      console.error('Failed to get tasks:', err);
      return [];
    }
  }, [getContract, getTask]);

  const applyForTask = useCallback(async (taskId, message) => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = await getContract();
      const tx = await contract.applyForTask(taskId, message);
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      return receipt;
    } catch (err) {
      setError(err.message || 'Failed to apply');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const submitWork = useCallback(async (taskId, deliverableURI) => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = await getContract();
      const tx = await contract.submitWork(taskId, deliverableURI);
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      return receipt;
    } catch (err) {
      setError(err.message || 'Failed to submit work');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const assignTask = useCallback(async (taskId, applicationId) => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = await getContract();
      const tx = await contract.assignTask(taskId, applicationId);
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      return receipt;
    } catch (err) {
      setError(err.message || 'Failed to assign task');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const publishTask = useCallback(async (taskId) => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = await getContract();
      const tx = await contract.publishTask(taskId);
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      return receipt;
    } catch (err) {
      setError(err.message || 'Failed to publish task');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  return {
    createTask,
    getTask,
    getAllTasks,
    applyForTask,
    submitWork,
    assignTask,
    publishTask,
    getContract, // Export for advanced usage
    isLoading,
    error,
  };
}

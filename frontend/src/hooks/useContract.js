import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContractAddress, getLiabilityPresets } from '../config/network';
import TaskRegistryABI from '../abis/TaskRegistry.json';
import AIAgentRegistryABI from '../abis/AIAgentRegistry.json';
import LiabilityPresetABI from '../abis/LiabilityPreset.json';

export const useContract = (signer) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txPending, setTxPending] = useState(false);

  // Get contract instances
  const getTaskRegistry = useCallback(() => {
    if (!signer) return null;
    const address = getContractAddress('TaskRegistry');
    if (!address) return null;
    return new ethers.Contract(address, TaskRegistryABI.abi, signer);
  }, [signer]);

  const getAgentRegistry = useCallback(() => {
    if (!signer) return null;
    const address = getContractAddress('AIAgentRegistry');
    if (!address) return null;
    return new ethers.Contract(address, AIAgentRegistryABI.abi, signer);
  }, [signer]);

  const getLiabilityPreset = useCallback(() => {
    if (!signer) return null;
    const address = getContractAddress('LiabilityPreset');
    if (!address) return null;
    return new ethers.Contract(address, LiabilityPresetABI.abi, signer);
  }, [signer]);

  // Task Operations
  const createTask = useCallback(async (taskData) => {
    const contract = getTaskRegistry();
    if (!contract) throw new Error('Contract not available');

    setLoading(true);
    setError(null);
    setTxPending(true);

    try {
      const {
        title,
        description,
        taskType,
        reward,
        deadline,
        requiredSkills,
        minReputation
      } = taskData;

      const rewardWei = ethers.parseEther(reward.toString());
      const platformFee = await contract.platformFee();
      const totalValue = rewardWei + (rewardWei * platformFee / 10000n);

      const tx = await contract.createTask(
        title,
        description,
        taskType,
        rewardWei,
        deadline,
        requiredSkills,
        minReputation,
        { value: totalValue }
      );

      const receipt = await tx.wait();
      
      // Parse task ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'TaskCreated';
        } catch { return false; }
      });

      const taskId = event ? event.args[0] : null;
      
      setTxPending(false);
      return { success: true, taskId, receipt };
    } catch (err) {
      setError(err.message);
      setTxPending(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getTaskRegistry]);

  const applyForTask = useCallback(async (taskId, proposal) => {
    const contract = getTaskRegistry();
    if (!contract) throw new Error('Contract not available');

    setLoading(true);
    setError(null);

    try {
      const tx = await contract.applyForTask(taskId, proposal);
      const receipt = await tx.wait();
      return { success: true, receipt };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getTaskRegistry]);

  const assignTask = useCallback(async (taskId, workerAddress) => {
    const contract = getTaskRegistry();
    if (!contract) throw new Error('Contract not available');

    setLoading(true);
    setError(null);

    try {
      const tx = await contract.assignTask(taskId, workerAddress);
      const receipt = await tx.wait();
      return { success: true, receipt };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getTaskRegistry]);

  const submitWork = useCallback(async (taskId, deliverableURI) => {
    const contract = getTaskRegistry();
    if (!contract) throw new Error('Contract not available');

    setLoading(true);
    setError(null);

    try {
      const tx = await contract.submitWork(taskId, deliverableURI);
      const receipt = await tx.wait();
      return { success: true, receipt };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getTaskRegistry]);

  const completeTask = useCallback(async (taskId) => {
    const contract = getTaskRegistry();
    if (!contract) throw new Error('Contract not available');

    setLoading(true);
    setError(null);

    try {
      const tx = await contract.completeTask(taskId);
      const receipt = await tx.wait();
      return { success: true, receipt };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getTaskRegistry]);

  // Agent Operations
  const registerAgent = useCallback(async (name, uri, wallet) => {
    const contract = getAgentRegistry();
    if (!contract) throw new Error('Contract not available');

    setLoading(true);
    setError(null);

    try {
      const registrationFee = await contract.registrationFee();
      
      const tx = await contract.registerAgent(name, uri, wallet, {
        value: registrationFee
      });
      
      const receipt = await tx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'AgentRegistered';
        } catch { return false; }
      });

      const agentId = event ? event.args[0] : null;
      
      return { success: true, agentId, receipt };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAgentRegistry]);

  // Get task details
  const getTask = useCallback(async (taskId) => {
    const contract = getTaskRegistry();
    if (!contract) return null;

    try {
      const task = await contract.tasks(taskId);
      return {
        id: taskId,
        title: task.title,
        description: task.description,
        taskType: Number(task.taskType),
        state: Number(task.state),
        publisher: task.publisher,
        worker: task.worker,
        reward: ethers.formatEther(task.reward),
        deadline: Number(task.deadline),
        requiredSkills: task.requiredSkills,
        minReputation: Number(task.minReputation),
        createdAt: Number(task.createdAt),
        assignedAt: Number(task.assignedAt),
        submittedAt: Number(task.submittedAt),
        completedAt: Number(task.completedAt),
        deliverableURI: task.deliverableURI
      };
    } catch (err) {
      console.error('Get task error:', err);
      return null;
    }
  }, [getTaskRegistry]);

  // Get all tasks
  const getAllTasks = useCallback(async () => {
    const contract = getTaskRegistry();
    if (!contract) return [];

    try {
      const taskCount = await contract.taskCounter();
      const tasks = [];
      
      for (let i = 0; i < taskCount; i++) {
        const task = await getTask(i);
        if (task) tasks.push(task);
      }
      
      return tasks;
    } catch (err) {
      console.error('Get all tasks error:', err);
      return [];
    }
  }, [getTaskRegistry, getTask]);

  // Get agent details
  const getAgent = useCallback(async (agentId) => {
    const contract = getAgentRegistry();
    if (!contract) return null;

    try {
      const agent = await contract.agents(agentId);
      return {
        id: agentId,
        name: agent.agentName,
        uri: agent.agentURI,
        wallet: agent.agentWallet,
        state: Number(agent.state),
        reputation: Number(agent.reputationScore) / 100,
        totalTasks: Number(agent.totalTasks),
        successfulTasks: Number(agent.successfulTasks)
      };
    } catch (err) {
      console.error('Get agent error:', err);
      return null;
    }
  }, [getAgentRegistry]);

  return {
    loading,
    error,
    txPending,
    createTask,
    applyForTask,
    assignTask,
    submitWork,
    completeTask,
    registerAgent,
    getTask,
    getAllTasks,
    getAgent
  };
};

export default useContract;

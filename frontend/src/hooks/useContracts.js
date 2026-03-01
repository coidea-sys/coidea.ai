import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getNetworkConfig, isLocal } from '../config/network';
import AIAgentRegistryABI from '../abis/AIAgentRegistry.json';
import HumanLevelNFTABI from '../abis/HumanLevelNFT.json';
import TaskRegistryABI from '../abis/TaskRegistry.json';
import X402PaymentABI from '../abis/X402Payment.json';

// 本地模拟数据
const MOCK_AGENTS = [
  {
    id: 1,
    name: 'Kimi Claw',
    uri: 'ipfs://QmExample1',
    wallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    state: 'Active',
    reputation: 8500,
    totalTasks: 42,
    successfulTasks: 40,
    registrant: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    registeredAt: Date.now() - 86400000 * 30,
  },
  {
    id: 2,
    name: 'CodeWeaver',
    uri: 'ipfs://QmExample2',
    wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    state: 'Active',
    reputation: 7200,
    totalTasks: 28,
    successfulTasks: 25,
    registrant: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    registeredAt: Date.now() - 86400000 * 15,
  }
];

const MOCK_TASKS = [
  {
    id: 1,
    title: 'Design coidea.ai Logo',
    description: 'Create a modern logo for the Web4 platform',
    reward: ethers.parseEther('0.1'),
    publisher: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    worker: null,
    state: 'Open',
    createdAt: Date.now() - 86400000,
    liabilityModel: 'Standard'
  },
  {
    id: 2,
    title: 'Implement x402 Payment Flow',
    description: 'Build the micropayment authorization system',
    reward: ethers.parseEther('0.5'),
    publisher: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    worker: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    state: 'Assigned',
    createdAt: Date.now() - 43200000,
    liabilityModel: 'Limited'
  }
];

export function useContracts(signer) {
  const [contracts, setContracts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!signer) {
      setContracts(null);
      setLoading(false);
      return;
    }

    const config = getNetworkConfig();
    
    if (isLocal() && !config.contracts.TaskRegistry) {
      setContracts({ isMock: true });
      setLoading(false);
      return;
    }

    try {
      const taskRegistry = new ethers.Contract(
        config.contracts.TaskRegistry,
        TaskRegistryABI.abi,
        signer
      );

      const agentRegistry = new ethers.Contract(
        config.contracts.AIAgentRegistry,
        AIAgentRegistryABI.abi,
        signer
      );

      const humanNFT = new ethers.Contract(
        config.contracts.HumanLevelNFT,
        HumanLevelNFTABI.abi,
        signer
      );

      const x402Payment = new ethers.Contract(
        config.contracts.X402Payment,
        X402PaymentABI.abi,
        signer
      );

      setContracts({
        isMock: false,
        taskRegistry,
        agentRegistry,
        humanNFT,
        x402Payment
      });
    } catch (error) {
      console.error('Contract initialization error:', error);
      setContracts({ isMock: true });
    }

    setLoading(false);
  }, [signer]);

  return { contracts, loading };
}

// 任务相关操作
export function useTasks(contracts) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    
    if (contracts?.isMock) {
      setTasks(MOCK_TASKS);
      setLoading(false);
      return;
    }

    if (!contracts?.taskRegistry) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setTasks(MOCK_TASKS);
    } catch (error) {
      console.error('Fetch tasks error:', error);
      setTasks([]);
    }
    
    setLoading(false);
  }, [contracts]);

  const createTask = useCallback(async (taskData) => {
    if (contracts?.isMock) {
      console.log('Mock: Create task', taskData);
      return { success: true, mock: true };
    }

    if (!contracts?.taskRegistry) {
      return { success: false, error: 'Contract not available' };
    }

    try {
      const liabilityModelMap = {
        'Standard': 0,
        'Limited': 1,
        'Insured': 2,
        'Bonded': 3
      };

      const tx = await contracts.taskRegistry.createTask(
        taskData.title,
        taskData.description,
        0, // taskType
        ethers.parseEther(taskData.reward.toString()),
        taskData.deadlineDays * 24 * 60 * 60,
        taskData.requiredSkills || [],
        taskData.minReputation || 0,
        liabilityModelMap[taskData.liabilityModel] || 0,
        ethers.parseEther((taskData.liabilityAmount || taskData.reward * 1.2).toString()),
        { value: ethers.parseEther(taskData.reward.toString()) }
      );
      
      const receipt = await tx.wait();
      return { success: true, tx: receipt };
    } catch (error) {
      console.error('Create task error:', error);
      return { success: false, error: error.message };
    }
  }, [contracts]);

  return { tasks, loading, fetchTasks, createTask };
}

// Agent 相关操作
export function useAgents(contracts) {
  const [agents, setAgents] = useState([]);

  const fetchAgents = useCallback(async () => {
    if (contracts?.isMock) {
      setAgents(MOCK_AGENTS);
      return;
    }

    if (!contracts?.agentRegistry) {
      setAgents([]);
      return;
    }

    try {
      setAgents(MOCK_AGENTS);
    } catch (error) {
      console.error('Fetch agents error:', error);
      setAgents([]);
    }
  }, [contracts]);

  return { agents, fetchAgents };
}

export default useContracts;

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getNetworkConfig, isLocal } from '../config/network';
import AIAgentRegistryABI from '../abis/AIAgentRegistry.json';
import HumanLevelNFTABI from '../abis/HumanLevelNFT.json';
import TaskRegistryABI from '../abis/TaskRegistry.json';

// 本地模拟数据（开发时使用）
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

const MOCK_HUMANS = [
  {
    id: 1,
    username: 'Danny',
    level: 4,
    contributionPoints: 15000,
    tasksPublished: 20,
    tasksCompleted: 35,
    reputationScore: 95,
    wallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
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
  }
];

export function useContracts(provider, signer) {
  const [contracts, setContracts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!provider) {
      setContracts(null);
      setLoading(false);
      return;
    }

    const config = getNetworkConfig();
    
    // 本地开发使用模拟数据
    if (isLocal() && !signer) {
      setContracts({
        isMock: true,
        agentRegistry: null,
        humanNFT: null,
        taskRegistry: null,
      });
      setLoading(false);
      return;
    }

    // 真实合约连接
    try {
      const agentRegistry = new ethers.Contract(
        config.contracts.AIAgentRegistry,
        AIAgentRegistryABI,
        signer || provider
      );

      const humanNFT = new ethers.Contract(
        config.contracts.HumanLevelNFT,
        HumanLevelNFTABI,
        signer || provider
      );

      const taskRegistry = new ethers.Contract(
        config.contracts.TaskRegistry,
        TaskRegistryABI,
        signer || provider
      );

      setContracts({
        isMock: false,
        agentRegistry,
        humanNFT,
        taskRegistry,
      });
    } catch (error) {
      console.error('Contract initialization error:', error);
    }

    setLoading(false);
  }, [provider, signer]);

  return { contracts, loading };
}

// Agent 相关操作
export function useAgents(contracts) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    
    if (contracts?.isMock) {
      // 本地模拟数据
      setAgents(MOCK_AGENTS);
      setLoading(false);
      return;
    }

    if (!contracts?.agentRegistry) {
      setAgents([]);
      setLoading(false);
      return;
    }

    try {
      // TODO: 实现真实的合约查询
      // const totalAgents = await contracts.agentRegistry.totalSupply();
      // const agentList = [];
      // for (let i = 0; i < totalAgents; i++) {
      //   const agent = await contracts.agentRegistry.agents(i);
      //   agentList.push(agent);
      // }
      // setAgents(agentList);
      setAgents(MOCK_AGENTS); // 临时使用模拟数据
    } catch (error) {
      console.error('Fetch agents error:', error);
    }
    
    setLoading(false);
  }, [contracts]);

  const registerAgent = useCallback(async (name, uri, wallet) => {
    if (contracts?.isMock) {
      console.log('Mock: Register agent', { name, uri, wallet });
      return { success: true, mock: true };
    }

    if (!contracts?.agentRegistry) return { success: false };

    try {
      const tx = await contracts.agentRegistry.registerAgent(name, uri, wallet);
      await tx.wait();
      return { success: true, tx };
    } catch (error) {
      console.error('Register agent error:', error);
      return { success: false, error };
    }
  }, [contracts]);

  return { agents, loading, fetchAgents, registerAgent };
}

// Human 相关操作
export function useHumans(contracts) {
  const [humans, setHumans] = useState([]);
  const [currentHuman, setCurrentHuman] = useState(null);

  const fetchHumans = useCallback(async () => {
    if (contracts?.isMock) {
      setHumans(MOCK_HUMANS);
      return;
    }
    // TODO: 实现真实查询
    setHumans(MOCK_HUMANS);
  }, [contracts]);

  const getHumanByWallet = useCallback(async (wallet) => {
    if (contracts?.isMock) {
      return MOCK_HUMANS.find(h => h.wallet.toLowerCase() === wallet.toLowerCase()) || null;
    }
    // TODO: 实现真实查询
    return null;
  }, [contracts]);

  return { humans, currentHuman, fetchHumans, getHumanByWallet };
}

// Task 相关操作
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

    // TODO: 实现真实查询
    setTasks(MOCK_TASKS);
    setLoading(false);
  }, [contracts]);

  const createTask = useCallback(async (title, description, reward) => {
    if (contracts?.isMock) {
      console.log('Mock: Create task', { title, description, reward });
      return { success: true, mock: true };
    }

    if (!contracts?.taskRegistry) return { success: false };

    try {
      const tx = await contracts.taskRegistry.createTask(title, description, {
        value: reward
      });
      await tx.wait();
      return { success: true, tx };
    } catch (error) {
      console.error('Create task error:', error);
      return { success: false, error };
    }
  }, [contracts]);

  return { tasks, loading, fetchTasks, createTask };
}

export default useContracts;

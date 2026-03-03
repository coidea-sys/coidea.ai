/**
 * Contract Service for Blockchain Interaction
 * TDD Implementation
 */

import { ethers } from 'ethers';

// Contract ABIs (simplified - import full ABIs in production)
import AIAgentRegistryABI from '../abis/AIAgentRegistry.json';
import HumanLevelNFTABI from '../abis/HumanLevelNFT.json';
import TaskRegistryABI from '../abis/TaskRegistry.json';

// Contract addresses from environment
const CONTRACT_ADDRESSES = {
  aiAgentRegistry: process.env.REACT_APP_AI_AGENT_REGISTRY_ADDRESS,
  humanLevelNFT: process.env.REACT_APP_HUMAN_LEVEL_NFT_ADDRESS,
  taskRegistry: process.env.REACT_APP_TASK_REGISTRY_ADDRESS
};

class ContractService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.account = null;
  }

  async connect() {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      this.account = accounts[0];

      // Create provider and signer
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();

      // Initialize contracts
      this.initializeContracts();

      // Setup event listeners
      this.setupEventListeners();

      return this.account;
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  initializeContracts() {
    if (!this.signer) {
      throw new Error('Not connected');
    }

    this.contracts = {
      aiAgentRegistry: new ethers.Contract(
        CONTRACT_ADDRESSES.aiAgentRegistry,
        AIAgentRegistryABI,
        this.signer
      ),
      humanLevelNFT: new ethers.Contract(
        CONTRACT_ADDRESSES.humanLevelNFT,
        HumanLevelNFTABI,
        this.signer
      ),
      taskRegistry: new ethers.Contract(
        CONTRACT_ADDRESSES.taskRegistry,
        TaskRegistryABI,
        this.signer
      )
    };
  }

  setupEventListeners() {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        this.account = accounts[0] || null;
        if (!this.account) {
          this.disconnect();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }

  disconnect() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.account = null;
  }

  async getNetwork() {
    if (!this.provider) {
      throw new Error('Not connected');
    }
    return await this.provider.getNetwork();
  }

  // Agent Operations
  async registerAgent(name, uri, wallet) {
    if (!this.contracts.aiAgentRegistry) {
      throw new Error('Contract not initialized');
    }

    const tx = await this.contracts.aiAgentRegistry.registerAgent(
      name,
      uri,
      wallet
    );
    return await tx.wait();
  }

  async getAgent(tokenId) {
    if (!this.contracts.aiAgentRegistry) {
      throw new Error('Contract not initialized');
    }
    return await this.contracts.aiAgentRegistry.getAgent(tokenId);
  }

  // Task Operations
  async createTask(title, description, reward, deadline) {
    if (!this.contracts.taskRegistry) {
      throw new Error('Contract not initialized');
    }

    const tx = await this.contracts.taskRegistry.createTask(
      title,
      description,
      reward,
      deadline
    );
    return await tx.wait();
  }

  async getTask(taskId) {
    if (!this.contracts.taskRegistry) {
      throw new Error('Contract not initialized');
    }
    return await this.contracts.taskRegistry.getTask(taskId);
  }

  // Human Operations
  async registerHuman(name, wallet) {
    if (!this.contracts.humanLevelNFT) {
      throw new Error('Contract not initialized');
    }

    const tx = await this.contracts.humanLevelNFT.registerHuman(
      name,
      wallet
    );
    return await tx.wait();
  }

  async getHuman(tokenId) {
    if (!this.contracts.humanLevelNFT) {
      throw new Error('Contract not initialized');
    }
    return await this.contracts.humanLevelNFT.getHuman(tokenId);
  }

  // Event Listeners
  onAgentRegistered(callback) {
    if (this.contracts.aiAgentRegistry) {
      this.contracts.aiAgentRegistry.on('AgentRegistered', callback);
    }
  }

  onTaskCreated(callback) {
    if (this.contracts.taskRegistry) {
      this.contracts.taskRegistry.on('TaskCreated', callback);
    }
  }

  removeAllListeners() {
    Object.values(this.contracts).forEach(contract => {
      contract.removeAllListeners();
    });
  }
}

// Singleton instance
let instance = null;

export function getContractService() {
  if (!instance) {
    instance = new ContractService();
  }
  return instance;
}

export function resetContractService() {
  if (instance) {
    instance.disconnect();
    instance = null;
  }
}

export default ContractService;

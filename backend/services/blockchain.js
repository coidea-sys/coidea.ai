const { ethers } = require('ethers');
const config = require('../config');

// ABI imports (simplified for now)
const AIAgentRegistryABI = require('../../artifacts/contracts/AIAgentRegistry.sol/AIAgentRegistry.json').abi;
const HumanLevelNFTABI = require('../../artifacts/contracts/HumanLevelNFT.sol/HumanLevelNFT.json').abi;
const TaskRegistryABI = require('../../artifacts/contracts/TaskRegistry.sol/TaskRegistry.json').abi;
const X402PaymentABI = require('../../artifacts/contracts/X402Payment.sol/X402Payment.json').abi;

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.contracts = {};
    
    // Initialize contracts if addresses are set
    if (config.contracts.aiAgentRegistry) {
      this.contracts.aiAgentRegistry = new ethers.Contract(
        config.contracts.aiAgentRegistry,
        AIAgentRegistryABI,
        this.provider
      );
    }
    
    if (config.contracts.humanLevelNFT) {
      this.contracts.humanLevelNFT = new ethers.Contract(
        config.contracts.humanLevelNFT,
        HumanLevelNFTABI,
        this.provider
      );
    }
    
    if (config.contracts.taskRegistry) {
      this.contracts.taskRegistry = new ethers.Contract(
        config.contracts.taskRegistry,
        TaskRegistryABI,
        this.provider
      );
    }
    
    if (config.contracts.x402Payment) {
      this.contracts.x402Payment = new ethers.Contract(
        config.contracts.x402Payment,
        X402PaymentABI,
        this.provider
      );
    }
  }
  
  // Get signer for write operations
  getSigner(privateKey) {
    return new ethers.Wallet(privateKey, this.provider);
  }
  
  // AI Agent Registry methods
  async getAgent(tokenId) {
    if (!this.contracts.aiAgentRegistry) {
      throw new Error('AIAgentRegistry contract not configured');
    }
    return await this.contracts.aiAgentRegistry.agents(tokenId);
  }
  
  async getAgentByWallet(wallet) {
    if (!this.contracts.aiAgentRegistry) {
      throw new Error('AIAgentRegistry contract not configured');
    }
    return await this.contracts.aiAgentRegistry.getAgentByWallet(wallet);
  }
  
  // Human Level NFT methods
  async getHuman(tokenId) {
    if (!this.contracts.humanLevelNFT) {
      throw new Error('HumanLevelNFT contract not configured');
    }
    return await this.contracts.humanLevelNFT.humans(tokenId);
  }
  
  // Task Registry methods
  async getTask(taskId) {
    if (!this.contracts.taskRegistry) {
      throw new Error('TaskRegistry contract not configured');
    }
    return await this.contracts.taskRegistry.tasks(taskId);
  }
  
  // Event listeners
  async listenToEvents(eventName, callback) {
    // Implementation for event listening
    console.log(`Listening to ${eventName} events...`);
  }
}

module.exports = new BlockchainService();

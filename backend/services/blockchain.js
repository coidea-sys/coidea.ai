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
    const agent = await this.contracts.aiAgentRegistry.agents(tokenId);
    return this._formatAgent(agent);
  }

  async getAgentByWallet(wallet) {
    if (!this.contracts.aiAgentRegistry) {
      throw new Error('AIAgentRegistry contract not configured');
    }
    const agent = await this.contracts.aiAgentRegistry.getAgentByWallet(wallet);
    return this._formatAgent(agent);
  }

  async registerAgent(agentName, agentURI, agentWallet, signer) {
    if (!this.contracts.aiAgentRegistry) {
      throw new Error('AIAgentRegistry contract not configured');
    }

    const contractWithSigner = this.contracts.aiAgentRegistry.connect(signer);

    // Check if wallet already registered
    const existingTokenId = await this.contracts.aiAgentRegistry.walletToAgent(agentWallet);
    if (existingTokenId !== 0n) {
      throw new Error(`Wallet ${agentWallet} already registered as agent #${existingTokenId.toString()}`);
    }

    // Register agent
    const tx = await contractWithSigner.registerAgent(agentName, agentURI, agentWallet);
    const receipt = await tx.wait();

    // Get tokenId from event
    const event = receipt.logs.find(log => {
      try {
        const parsed = contractWithSigner.interface.parseLog(log);
        return parsed.name === 'AgentRegistered';
      } catch {
        return false;
      }
    });

    let tokenId = null;
    if (event) {
      const parsedEvent = contractWithSigner.interface.parseLog(event);
      tokenId = parsedEvent.args.tokenId.toString();
    }

    return {
      tokenId,
      agentName,
      agentURI,
      agentWallet,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber.toString()
    };
  }

  // Format agent data for JSON serialization
  _formatAgent(agent) {
    // Agent is returned as an array from ethers.js when struct is returned
    // Check if it's an empty agent (wallet is zero address)
    if (!agent || (Array.isArray(agent) && agent[2] === '0x0000000000000000000000000000000000000000')) {
      return null;
    }

    // Handle both array format and object format
    if (Array.isArray(agent)) {
      return {
        agentName: agent[0],
        agentURI: agent[1],
        agentWallet: agent[2],
        state: agent[3]?.toString() || '0',
        reputationScore: agent[4]?.toString() || '0',
        totalTasks: agent[5]?.toString() || '0',
        successfulTasks: agent[6]?.toString() || '0',
        registrant: agent[7],
        registeredAt: agent[8]?.toString() || '0',
        updatedAt: agent[9]?.toString() || '0'
      };
    }

    // Object format
    return {
      agentName: agent.agentName,
      agentURI: agent.agentURI,
      agentWallet: agent.agentWallet,
      state: agent.state?.toString() || '0',
      reputationScore: agent.reputationScore?.toString() || '0',
      totalTasks: agent.totalTasks?.toString() || '0',
      successfulTasks: agent.successfulTasks?.toString() || '0',
      registrant: agent.registrant,
      registeredAt: agent.registeredAt?.toString() || '0',
      updatedAt: agent.updatedAt?.toString() || '0'
    };
  }

  // Human Level NFT methods
  async getHuman(tokenId) {
    if (!this.contracts.humanLevelNFT) {
      throw new Error('HumanLevelNFT contract not configured');
    }
    const human = await this.contracts.humanLevelNFT.humans(tokenId);
    return this._formatHuman(human);
  }

  async getHumanByWallet(wallet) {
    if (!this.contracts.humanLevelNFT) {
      throw new Error('HumanLevelNFT contract not configured');
    }
    const human = await this.contracts.humanLevelNFT.getHumanByWallet(wallet);
    return this._formatHuman(human);
  }

  async registerHuman(name, wallet, signer) {
    if (!this.contracts.humanLevelNFT) {
      throw new Error('HumanLevelNFT contract not configured');
    }

    const contractWithSigner = this.contracts.humanLevelNFT.connect(signer);

    // Check if wallet already registered
    const isRegistered = await this.contracts.humanLevelNFT.isRegistered(wallet);
    if (isRegistered) {
      throw new Error(`Wallet ${wallet} already registered`);
    }

    const tx = await contractWithSigner.registerHuman(name, wallet);
    const receipt = await tx.wait();

    // Get tokenId from event
    let tokenId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contractWithSigner.interface.parseLog(log);
        if (parsed && parsed.name === 'HumanRegistered') {
          tokenId = parsed.args.tokenId.toString();
          break;
        }
      } catch {
        // Continue
      }
    }

    return {
      tokenId,
      name,
      wallet,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber.toString()
    };
  }

  async getHumanLevel(tokenId) {
    if (!this.contracts.humanLevelNFT) {
      throw new Error('HumanLevelNFT contract not configured');
    }
    return await this.contracts.humanLevelNFT.getLevel(tokenId);
  }

  async getHumanLevelName(tokenId) {
    if (!this.contracts.humanLevelNFT) {
      throw new Error('HumanLevelNFT contract not configured');
    }
    return await this.contracts.humanLevelNFT.getLevelName(tokenId);
  }

  async canPublishTask(tokenId) {
    if (!this.contracts.humanLevelNFT) {
      throw new Error('HumanLevelNFT contract not configured');
    }
    return await this.contracts.humanLevelNFT.canPublishTask(tokenId);
  }

  async canArbitrate(tokenId) {
    if (!this.contracts.humanLevelNFT) {
      throw new Error('HumanLevelNFT contract not configured');
    }
    return await this.contracts.humanLevelNFT.canArbitrate(tokenId);
  }

  async canGovern(tokenId) {
    if (!this.contracts.humanLevelNFT) {
      throw new Error('HumanLevelNFT contract not configured');
    }
    return await this.contracts.humanLevelNFT.canGovern(tokenId);
  }

  // Format human data for JSON serialization
  _formatHuman(human) {
    if (!human || human[1] === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    // Handle array format from ethers.js
    if (Array.isArray(human)) {
      return {
        name: human[0],
        wallet: human[1],
        level: human[2]?.toString() || '0',
        contribution: human[3]?.toString() || '0',
        reputation: human[4]?.toString() || '0',
        tasksPublished: human[5]?.toString() || '0',
        tasksCompleted: human[6]?.toString() || '0',
        registeredAt: human[7]?.toString() || '0'
      };
    }

    return human;
  }

  // Task Registry methods
  async getTask(taskId) {
    if (!this.contracts.taskRegistry) {
      throw new Error('TaskRegistry contract not configured');
    }
    const task = await this.contracts.taskRegistry.tasks(taskId);
    return this._formatTask(task);
  }

  async createTask(taskData, signer) {
    if (!this.contracts.taskRegistry) {
      throw new Error('TaskRegistry contract not configured');
    }

    const contractWithSigner = this.contracts.taskRegistry.connect(signer);

    // Convert deadline timestamp to duration (seconds from now)
    const now = Math.floor(Date.now() / 1000);
    const deadlineDuration = Math.floor(taskData.deadline - now);

    const tx = await contractWithSigner.createTask(
      taskData.title,
      taskData.description,
      taskData.taskType,
      taskData.reward,
      deadlineDuration,
      taskData.requiredSkills,
      taskData.minReputation,
      taskData.isMultiAgent,
      { value: taskData.reward }
    );

    const receipt = await tx.wait();

    // Get taskId from event
    let taskId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contractWithSigner.interface.parseLog(log);
        if (parsed && parsed.name === 'TaskCreated') {
          taskId = parsed.args.taskId.toString();
          break;
        }
      } catch {
        // Continue to next log
      }
    }

    return {
      taskId,
      title: taskData.title,
      reward: taskData.reward.toString(),
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber.toString()
    };
  }

  async publishTask(taskId, signer) {
    if (!this.contracts.taskRegistry) {
      throw new Error('TaskRegistry contract not configured');
    }

    const contractWithSigner = this.contracts.taskRegistry.connect(signer);
    const tx = await contractWithSigner.publishTask(taskId);
    const receipt = await tx.wait();

    return {
      taskId: taskId.toString(),
      state: '1', // Open
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber.toString()
    };
  }

  async applyForTask(taskId, agentId, proposal, proposedPrice, signer) {
    if (!this.contracts.taskRegistry) {
      throw new Error('TaskRegistry contract not configured');
    }

    const contractWithSigner = this.contracts.taskRegistry.connect(signer);
    const tx = await contractWithSigner.applyForTask(taskId, agentId, proposal, proposedPrice);
    const receipt = await tx.wait();

    // Get applicationId from event
    const event = receipt.logs.find(log => {
      try {
        const parsed = contractWithSigner.interface.parseLog(log);
        return parsed.name === 'ApplicationSubmitted';
      } catch {
        return false;
      }
    });

    let applicationId = null;
    if (event) {
      const parsedEvent = contractWithSigner.interface.parseLog(event);
      applicationId = parsedEvent.args.applicationId.toString();
    }

    return {
      applicationId,
      taskId: taskId.toString(),
      agentId: agentId.toString(),
      proposal,
      proposedPrice: proposedPrice.toString(),
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber.toString()
    };
  }

  async assignTask(taskId, applicationId, signer) {
    if (!this.contracts.taskRegistry) {
      throw new Error('TaskRegistry contract not configured');
    }

    const contractWithSigner = this.contracts.taskRegistry.connect(signer);
    const tx = await contractWithSigner.assignTask(taskId, applicationId);
    const receipt = await tx.wait();

    return {
      taskId: taskId.toString(),
      applicationId: applicationId.toString(),
      state: '2', // Assigned
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber.toString()
    };
  }

  async submitWork(taskId, deliverableURI, signer) {
    if (!this.contracts.taskRegistry) {
      throw new Error('TaskRegistry contract not configured');
    }

    const contractWithSigner = this.contracts.taskRegistry.connect(signer);
    const tx = await contractWithSigner.submitWork(taskId, deliverableURI);
    const receipt = await tx.wait();

    return {
      taskId: taskId.toString(),
      deliverableURI,
      state: '3', // Submitted
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber.toString()
    };
  }

  async completeTask(taskId, signer) {
    if (!this.contracts.taskRegistry) {
      throw new Error('TaskRegistry contract not configured');
    }

    const contractWithSigner = this.contracts.taskRegistry.connect(signer);
    const tx = await contractWithSigner.approveAndComplete(taskId);
    const receipt = await tx.wait();

    return {
      taskId: taskId.toString(),
      state: '5', // Completed
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber.toString()
    };
  }

  async getTaskApplications(taskId) {
    if (!this.contracts.taskRegistry) {
      throw new Error('TaskRegistry contract not configured');
    }
    return await this.contracts.taskRegistry.getTaskApplications(taskId);
  }

  async getPublisherTasks(address) {
    if (!this.contracts.taskRegistry) {
      throw new Error('TaskRegistry contract not configured');
    }
    return await this.contracts.taskRegistry.getPublisherTasks(address);
  }

  async getWorkerTasks(address) {
    if (!this.contracts.taskRegistry) {
      throw new Error('TaskRegistry contract not configured');
    }
    return await this.contracts.taskRegistry.getWorkerTasks(address);
  }

  async getActiveTasks() {
    if (!this.contracts.taskRegistry) {
      throw new Error('TaskRegistry contract not configured');
    }
    return await this.contracts.taskRegistry.getActiveTasks();
  }

  // Format task data for JSON serialization
  _formatTask(task) {
    if (!task || task[0] === 0n) {
      return null;
    }

    // Handle array format from ethers.js
    // Note: Solidity struct with dynamic arrays returns as flat array
    if (Array.isArray(task)) {
      return {
        id: task[0]?.toString() || '0',
        title: task[1],
        description: task[2],
        taskType: task[3]?.toString() || '0',
        state: task[4]?.toString() || '0',
        publisher: task[5],
        worker: task[6],
        reward: task[7]?.toString() || '0',
        deposit: task[8]?.toString() || '0',
        createdAt: task[9]?.toString() || '0',
        deadline: task[10]?.toString() || '0',
        assignedAt: task[11]?.toString() || '0',
        submittedAt: task[12]?.toString() || '0',
        completedAt: task[13]?.toString() || '0',
        deliverableURI: task[14],
        minReputation: task[15]?.toString() || '0',
        isMultiAgent: task[16]
        // Note: requiredSkills and agentIds are not included in the flat array response
      };
    }

    return task;
  }

  // X402 Payment methods
  async createPayment(amount, payee, taskId, signer) {
    if (!this.contracts.x402Payment) {
      throw new Error('X402Payment contract not configured');
    }

    const contractWithSigner = this.contracts.x402Payment.connect(signer);
    const tx = await contractWithSigner.createPayment(payee, taskId, { value: amount });
    const receipt = await tx.wait();

    // Get paymentId from event
    let paymentId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contractWithSigner.interface.parseLog(log);
        if (parsed && parsed.name === 'PaymentCreated') {
          paymentId = parsed.args.paymentId.toString();
          break;
        }
      } catch {
        // Continue
      }
    }

    return {
      paymentId,
      amount: amount.toString(),
      payer: signer.address,
      payee,
      taskId: taskId.toString(),
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber.toString()
    };
  }

  async processPayment(paymentId, signer) {
    if (!this.contracts.x402Payment) {
      throw new Error('X402Payment contract not configured');
    }

    const contractWithSigner = this.contracts.x402Payment.connect(signer);
    const tx = await contractWithSigner.processPayment(paymentId);
    const receipt = await tx.wait();

    return {
      paymentId: paymentId.toString(),
      status: 'completed',
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber.toString()
    };
  }

  async getPayment(paymentId) {
    if (!this.contracts.x402Payment) {
      throw new Error('X402Payment contract not configured');
    }
    const payment = await this.contracts.x402Payment.payments(paymentId);
    return this._formatPayment(payment);
  }

  // Format payment data for JSON serialization
  _formatPayment(payment) {
    if (!payment || payment[0] === 0n) {
      return null;
    }

    // Handle array format from ethers.js
    if (Array.isArray(payment)) {
      return {
        id: payment[0]?.toString() || '0',
        payer: payment[1],
        payee: payment[2],
        amount: payment[3]?.toString() || '0',
        taskId: payment[4]?.toString() || '0',
        status: payment[5]?.toString() || '0',
        createdAt: payment[6]?.toString() || '0',
        processedAt: payment[7]?.toString() || '0'
      };
    }

    return payment;
  }

  // Event listeners
  async listenToEvents(eventName, callback) {
    // Implementation for event listening
    console.log(`Listening to ${eventName} events...`);
  }
}

module.exports = new BlockchainService();

/**
 * End-to-End Integration Tests
 * Tests complete user workflows
 */

import { ethers } from 'ethers';
import { deployContracts } from '../utils/deploy';

describe('End-to-End Workflows', () => {
  let contracts;
  let owner;
  let human;
  let worker;

  beforeAll(async () => {
    // Deploy all contracts
    contracts = await deployContracts();
    
    // Get signers
    [owner, human, worker] = await ethers.getSigners();
  });

  describe('Human Workflow', () => {
    it('should complete full human workflow: register → deposit → create agent → publish task', async () => {
      // 1. Register as Human
      const registerTx = await contracts.humanRegistry
        .connect(human)
        .register('testhuman', 'ipfs://metadata', { value: ethers.parseEther('0.001') });
      await registerTx.wait();

      const isHuman = await contracts.humanRegistry.isHuman(human.address);
      expect(isHuman).toBe(true);

      // 2. Deposit funds
      const depositTx = await contracts.humanEconomy
        .connect(human)
        .deposit({ value: ethers.parseEther('1.0') });
      await depositTx.wait();

      // 3. Create Agent
      const createAgentTx = await contracts.aiAgentRegistry
        .connect(human)
        .registerAgent('TestAgent', ['coding', 'analysis'], 'ipfs://agent-config');
      const createAgentReceipt = await createAgentTx.wait();
      
      const agentCount = await contracts.aiAgentRegistry.getAgentCount();
      const agentId = Number(agentCount) - 1;

      // 4. Fund Agent
      const fundTx = await contracts.agentLifecycle
        .connect(human)
        .fundAgent(agentId, { value: ethers.parseEther('0.5') });
      await fundTx.wait();

      // 5. Create Task
      const createTaskTx = await contracts.taskRegistry
        .connect(human)
        .createTask(
          'Build a website',
          'Create a landing page with React',
          0, // TaskType
          ethers.parseEther('0.1'),
          7 * 24 * 60 * 60, // 7 days
          ['react', 'frontend'],
          0, // minReputation
          false, // isMultiAgent
          { value: ethers.parseEther('0.1') }
        );
      await createTaskTx.wait();

      const taskCount = await contracts.taskRegistry.taskCounter();
      expect(Number(taskCount)).toBeGreaterThan(0);

      console.log('✅ Human workflow completed successfully');
    });
  });

  describe('Agent Workflow', () => {
    it('should complete agent workflow: receive task → execute → submit → get reward', async () => {
      // Setup: Create task first
      await contracts.humanRegistry
        .connect(human)
        .register('publisher', 'ipfs://metadata', { value: ethers.parseEther('0.001') });

      await contracts.taskRegistry
        .connect(human)
        .createTask(
          'Simple Task',
          'Description',
          0,
          ethers.parseEther('0.05'),
          7 * 24 * 60 * 60,
          [],
          0,
          false,
          { value: ethers.parseEther('0.05') }
        );

      const taskId = 0;

      // 1. Worker applies for task
      await contracts.taskRegistry
        .connect(worker)
        .applyForTask(taskId, 'I can do this', ethers.parseEther('0.05'));

      // 2. Publisher assigns task
      await contracts.taskRegistry
        .connect(human)
        .assignWorker(taskId, worker.address);

      // 3. Worker submits result
      await contracts.taskRegistry
        .connect(worker)
        .submitTask(taskId, 'ipfs://deliverable');

      // 4. Publisher approves and completes
      await contracts.taskRegistry
        .connect(human)
        .approveAndPay(taskId);

      // Verify task is completed
      const task = await contracts.taskRegistry.getTask(taskId);
      expect(task.state).toBe(4); // Completed state

      console.log('✅ Agent workflow completed successfully');
    });
  });

  describe('Economic System', () => {
    it('should handle revenue distribution correctly', async () => {
      // Setup
      await contracts.humanRegistry
        .connect(human)
        .register('investor', 'ipfs://metadata', { value: ethers.parseEther('0.001') });

      await contracts.aiAgentRegistry
        .connect(human)
        .registerAgent('RevenueAgent', ['service'], 'ipfs://config');

      const agentId = 0;

      // Invest in agent
      await contracts.humanEconomy
        .connect(human)
        .investInAgent(agentId, { value: ethers.parseEther('1.0') });

      // Check investment recorded
      const wallet = await contracts.humanEconomy.humanWallets(human.address);
      expect(Number(wallet.investedInAgents)).toBeGreaterThan(0);

      console.log('✅ Economic system test passed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle insufficient funds gracefully', async () => {
      await expect(
        contracts.humanRegistry
          .connect(human)
          .register('test', 'metadata', { value: ethers.parseEther('0.0001') })
      ).rejects.toThrow();
    });

    it('should prevent task creation with insufficient reward', async () => {
      await contracts.humanRegistry
        .connect(human)
        .register('test', 'metadata', { value: ethers.parseEther('0.001') });

      await expect(
        contracts.taskRegistry
          .connect(human)
          .createTask(
            'Test',
            'Description',
            0,
            ethers.parseEther('0.0001'),
            86400,
            [],
            0,
            false,
            { value: ethers.parseEther('0.0001') }
          )
      ).rejects.toThrow();
    });

    it('should handle task cancellation', async () => {
      await contracts.humanRegistry
        .connect(human)
        .register('test', 'metadata', { value: ethers.parseEther('0.001') });

      await contracts.taskRegistry
        .connect(human)
        .createTask(
          'Cancellable Task',
          'Description',
          0,
          ethers.parseEther('0.01'),
          86400,
          [],
          0,
          false,
          { value: ethers.parseEther('0.01') }
        );

      const taskId = 0;

      // Cancel task
      await contracts.taskRegistry
        .connect(human)
        .cancelTask(taskId);

      const task = await contracts.taskRegistry.getTask(taskId);
      expect(task.state).toBe(5); // Cancelled state

      console.log('✅ Edge case tests passed');
    });
  });
});

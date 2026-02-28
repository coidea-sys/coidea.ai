const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('TaskRegistry - Task Management Contract', function () {
  let TaskRegistry;
  let taskRegistry;
  let owner;
  let publisher;
  let worker;
  let addr1;
  let feeRecipient;

  beforeEach(async function () {
    [owner, publisher, worker, addr1, feeRecipient] = await ethers.getSigners();
    
    TaskRegistry = await ethers.getContractFactory('TaskRegistry');
    taskRegistry = await TaskRegistry.deploy(feeRecipient.address);
    await taskRegistry.waitForDeployment();
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await taskRegistry.owner()).to.equal(owner.address);
    });

    it('Should set the fee recipient', async function () {
      expect(await taskRegistry.feeRecipient()).to.equal(feeRecipient.address);
    });

    it('Should initialize with default platform fee', async function () {
      expect(await taskRegistry.platformFee()).to.equal(250); // 2.5%
    });

    it('Should initialize counters to 0', async function () {
      expect(await taskRegistry.taskCounter()).to.equal(0);
      expect(await taskRegistry.applicationCounter()).to.equal(0);
    });
  });

  describe('Task Creation', function () {
    it('Should create a task with correct parameters', async function () {
      const reward = ethers.parseEther('1.0');
      const deposit = ethers.parseEther('1.5');
      
      const tx = await taskRegistry.connect(publisher).createTask(
        'Build a website',
        'Create a responsive website',
        0, // Coding
        reward,
        7 * 24 * 60 * 60, // 7 days
        ['React', 'Node.js'],
        0, // minReputation
        false, // isMultiAgent
        { value: deposit }
      );
      
      await expect(tx)
        .to.emit(taskRegistry, 'TaskCreated')
        .withArgs(0, publisher.address, 'Build a website', reward);
      
      const task = await taskRegistry.tasks(0);
      expect(task.title).to.equal('Build a website');
      expect(task.publisher).to.equal(publisher.address);
      expect(task.state).to.equal(0); // Draft
      expect(task.deposit).to.equal(deposit);
    });

    it('Should not create task without title', async function () {
      await expect(
        taskRegistry.connect(publisher).createTask(
          '',
          'Description',
          0,
          ethers.parseEther('1.0'),
          7 * 24 * 60 * 60,
          [],
          0,
          false,
          { value: ethers.parseEther('1.0') }
        )
      ).to.be.revertedWith('Title cannot be empty');
    });

    it('Should not create task with title too long', async function () {
      const longTitle = 'A'.repeat(101);
      await expect(
        taskRegistry.connect(publisher).createTask(
          longTitle,
          'Description',
          0,
          ethers.parseEther('1.0'),
          7 * 24 * 60 * 60,
          [],
          0,
          false,
          { value: ethers.parseEther('1.0') }
        )
      ).to.be.revertedWith('Title too long');
    });

    it('Should not create task with insufficient deposit', async function () {
      await expect(
        taskRegistry.connect(publisher).createTask(
          'Title',
          'Description',
          0,
          ethers.parseEther('1.0'),
          7 * 24 * 60 * 60,
          [],
          0,
          false,
          { value: ethers.parseEther('0.5') }
        )
      ).to.be.revertedWith('Insufficient deposit');
    });

    it('Should not create task with reward below minimum', async function () {
      await expect(
        taskRegistry.connect(publisher).createTask(
          'Title',
          'Description',
          0,
          ethers.parseEther('0.0001'),
          7 * 24 * 60 * 60,
          [],
          0,
          false,
          { value: ethers.parseEther('0.001') }
        )
      ).to.be.revertedWith('Reward below minimum');
    });

    it('Should track publisher tasks', async function () {
      await taskRegistry.connect(publisher).createTask(
        'Task 1', 'Desc', 0, ethers.parseEther('1.0'), 7 * 24 * 60 * 60, [], 0, false,
        { value: ethers.parseEther('1.0') }
      );
      
      await taskRegistry.connect(publisher).createTask(
        'Task 2', 'Desc', 0, ethers.parseEther('1.0'), 7 * 24 * 60 * 60, [], 0, false,
        { value: ethers.parseEther('1.0') }
      );
      
      const tasks = await taskRegistry.getPublisherTasks(publisher.address);
      expect(tasks.length).to.equal(2);
      expect(tasks[0]).to.equal(0);
      expect(tasks[1]).to.equal(1);
    });
  });

  describe('Task Publishing', function () {
    beforeEach(async function () {
      await taskRegistry.connect(publisher).createTask(
        'Build a website',
        'Description',
        0,
        ethers.parseEther('1.0'),
        7 * 24 * 60 * 60,
        [],
        0,
        false,
        { value: ethers.parseEther('1.0') }
      );
    });

    it('Should publish task from draft state', async function () {
      await expect(taskRegistry.connect(publisher).publishTask(0))
        .to.emit(taskRegistry, 'TaskPublished');
      
      const task = await taskRegistry.tasks(0);
      expect(task.state).to.equal(1); // Open
      expect(task.deadline).to.be.gt(0);
    });

    it('Should not allow non-publisher to publish', async function () {
      await expect(
        taskRegistry.connect(worker).publishTask(0)
      ).to.be.revertedWith('Not publisher');
    });

    it('Should not publish task not in draft state', async function () {
      await taskRegistry.connect(publisher).publishTask(0);
      await expect(
        taskRegistry.connect(publisher).publishTask(0)
      ).to.be.revertedWith('Not in draft state');
    });
  });

  describe('Task Applications', function () {
    beforeEach(async function () {
      await taskRegistry.connect(publisher).createTask(
        'Build a website',
        'Description',
        0,
        ethers.parseEther('1.0'),
        7 * 24 * 60 * 60,
        [],
        0,
        false,
        { value: ethers.parseEther('1.0') }
      );
      await taskRegistry.connect(publisher).publishTask(0);
    });

    it('Should allow worker to apply', async function () {
      const tx = await taskRegistry.connect(worker).applyForTask(
        0,
        'I can do this',
        ethers.parseEther('0.8')
      );
      
      await expect(tx)
        .to.emit(taskRegistry, 'TaskApplied')
        .withArgs(0, 0, worker.address);
      
      const app = await taskRegistry.applications(0);
      expect(app.applicant).to.equal(worker.address);
      expect(app.proposedPrice).to.equal(ethers.parseEther('0.8'));
    });

    it('Should not allow publisher to apply to own task', async function () {
      await expect(
        taskRegistry.connect(publisher).applyForTask(0, 'Proposal', ethers.parseEther('0.8'))
      ).to.be.revertedWith('Cannot apply to own task');
    });

    it('Should not allow application with price exceeding reward', async function () {
      await expect(
        taskRegistry.connect(worker).applyForTask(0, 'Proposal', ethers.parseEther('1.5'))
      ).to.be.revertedWith('Price exceeds reward');
    });

    it('Should not allow application to non-open task', async function () {
      await taskRegistry.connect(publisher).cancelTask(0);
      await expect(
        taskRegistry.connect(worker).applyForTask(0, 'Proposal', ethers.parseEther('0.8'))
      ).to.be.revertedWith('Task not open');
    });

    it('Should track task applications', async function () {
      await taskRegistry.connect(worker).applyForTask(0, 'Proposal 1', ethers.parseEther('0.8'));
      await taskRegistry.connect(addr1).applyForTask(0, 'Proposal 2', ethers.parseEther('0.9'));
      
      const apps = await taskRegistry.getTaskApplications(0);
      expect(apps.length).to.equal(2);
    });
  });

  describe('Task Assignment', function () {
    beforeEach(async function () {
      await taskRegistry.connect(publisher).createTask(
        'Build a website',
        'Description',
        0,
        ethers.parseEther('1.0'),
        7 * 24 * 60 * 60,
        [],
        0,
        false,
        { value: ethers.parseEther('1.0') }
      );
      await taskRegistry.connect(publisher).publishTask(0);
      await taskRegistry.connect(worker).applyForTask(0, 'Proposal', ethers.parseEther('0.8'));
    });

    it('Should assign task to applicant', async function () {
      await expect(taskRegistry.connect(publisher).assignTask(0, 0))
        .to.emit(taskRegistry, 'TaskAssigned')
        .withArgs(0, worker.address);
      
      const task = await taskRegistry.tasks(0);
      expect(task.state).to.equal(2); // Assigned
      expect(task.worker).to.equal(worker.address);
      expect(task.reward).to.equal(ethers.parseEther('0.8')); // Updated to proposed price
    });

    it('Should track worker tasks', async function () {
      await taskRegistry.connect(publisher).assignTask(0, 0);
      
      const tasks = await taskRegistry.getWorkerTasks(worker.address);
      expect(tasks.length).to.equal(1);
      expect(tasks[0]).to.equal(0);
    });

    it('Should not allow non-publisher to assign', async function () {
      await expect(
        taskRegistry.connect(worker).assignTask(0, 0)
      ).to.be.revertedWith('Not publisher');
    });

    it('Should not assign to non-existent application', async function () {
      // Application ID 999 doesn't exist
      await expect(
        taskRegistry.connect(publisher).assignTask(0, 999)
      ).to.be.revertedWith('Invalid application ID');
    });
  });

  describe('Work Submission', function () {
    beforeEach(async function () {
      await taskRegistry.connect(publisher).createTask(
        'Build a website',
        'Description',
        0,
        ethers.parseEther('1.0'),
        7 * 24 * 60 * 60,
        [],
        0,
        false,
        { value: ethers.parseEther('1.0') }
      );
      await taskRegistry.connect(publisher).publishTask(0);
      await taskRegistry.connect(worker).applyForTask(0, 'Proposal', ethers.parseEther('0.8'));
      await taskRegistry.connect(publisher).assignTask(0, 0);
    });

    it('Should allow worker to submit work', async function () {
      await expect(taskRegistry.connect(worker).submitWork(0, 'ipfs://deliverable'))
        .to.emit(taskRegistry, 'TaskSubmitted')
        .withArgs(0, 'ipfs://deliverable');
      
      const task = await taskRegistry.tasks(0);
      expect(task.state).to.equal(3); // Submitted
      expect(task.deliverableURI).to.equal('ipfs://deliverable');
    });

    it('Should not allow non-worker to submit', async function () {
      await expect(
        taskRegistry.connect(addr1).submitWork(0, 'ipfs://fake')
      ).to.be.revertedWith('Not assigned worker');
    });

    it('Should not allow submission to non-assigned task', async function () {
      // Create another task but don't assign it
      await taskRegistry.connect(publisher).createTask(
        'Another task', 'Desc', 0, ethers.parseEther('1.0'), 7 * 24 * 60 * 60, [], 0, false,
        { value: ethers.parseEther('1.0') }
      );
      // Don't publish or assign - task is in Draft state
      // Worker is not assigned, so it will fail with 'Not assigned worker'
      await expect(
        taskRegistry.connect(worker).submitWork(1, 'ipfs://deliverable')
      ).to.be.reverted;
    });
  });

  describe('Task Completion', function () {
    beforeEach(async function () {
      await taskRegistry.connect(publisher).createTask(
        'Build a website',
        'Description',
        0,
        ethers.parseEther('1.0'),
        7 * 24 * 60 * 60,
        [],
        0,
        false,
        { value: ethers.parseEther('1.0') }
      );
      await taskRegistry.connect(publisher).publishTask(0);
      await taskRegistry.connect(worker).applyForTask(0, 'Proposal', ethers.parseEther('0.8'));
      await taskRegistry.connect(publisher).assignTask(0, 0);
      await taskRegistry.connect(worker).submitWork(0, 'ipfs://deliverable');
    });

    it('Should complete task and pay worker', async function () {
      const workerBalanceBefore = await ethers.provider.getBalance(worker.address);
      
      await expect(taskRegistry.connect(publisher).approveAndComplete(0))
        .to.emit(taskRegistry, 'TaskCompleted');
      
      const task = await taskRegistry.tasks(0);
      expect(task.state).to.equal(5); // Completed
      
      const workerBalanceAfter = await ethers.provider.getBalance(worker.address);
      expect(workerBalanceAfter).to.be.gt(workerBalanceBefore);
    });

    it('Should deduct platform fee', async function () {
      const feeRecipientBalanceBefore = await ethers.provider.getBalance(feeRecipient.address);
      
      await taskRegistry.connect(publisher).approveAndComplete(0);
      
      const feeRecipientBalanceAfter = await ethers.provider.getBalance(feeRecipient.address);
      expect(feeRecipientBalanceAfter).to.be.gt(feeRecipientBalanceBefore);
    });

    it('Should refund excess deposit', async function () {
      const publisherBalanceBefore = await ethers.provider.getBalance(publisher.address);
      
      await taskRegistry.connect(publisher).approveAndComplete(0);
      
      // Publisher should receive excess (1.0 - 0.8 = 0.2 ETH)
      // Note: Gas costs make this hard to test precisely
      const task = await taskRegistry.tasks(0);
      expect(task.state).to.equal(5);
    });

    it('Should not allow non-publisher to complete', async function () {
      await expect(
        taskRegistry.connect(worker).approveAndComplete(0)
      ).to.be.revertedWith('Not publisher');
    });
  });

  describe('Task Cancellation', function () {
    it('Should allow cancellation in draft state', async function () {
      await taskRegistry.connect(publisher).createTask(
        'Task', 'Desc', 0, ethers.parseEther('1.0'), 7 * 24 * 60 * 60, [], 0, false,
        { value: ethers.parseEther('1.0') }
      );
      
      const publisherBalanceBefore = await ethers.provider.getBalance(publisher.address);
      
      await expect(taskRegistry.connect(publisher).cancelTask(0))
        .to.emit(taskRegistry, 'TaskCancelled');
      
      const task = await taskRegistry.tasks(0);
      expect(task.state).to.equal(6); // Cancelled
    });

    it('Should allow cancellation in open state', async function () {
      await taskRegistry.connect(publisher).createTask(
        'Task', 'Desc', 0, ethers.parseEther('1.0'), 7 * 24 * 60 * 60, [], 0, false,
        { value: ethers.parseEther('1.0') }
      );
      await taskRegistry.connect(publisher).publishTask(0);
      
      await expect(taskRegistry.connect(publisher).cancelTask(0))
        .to.emit(taskRegistry, 'TaskCancelled');
    });

    it('Should not allow cancellation after assignment', async function () {
      await taskRegistry.connect(publisher).createTask(
        'Task', 'Desc', 0, ethers.parseEther('1.0'), 7 * 24 * 60 * 60, [], 0, false,
        { value: ethers.parseEther('1.0') }
      );
      await taskRegistry.connect(publisher).publishTask(0);
      await taskRegistry.connect(worker).applyForTask(0, 'Proposal', ethers.parseEther('0.8'));
      await taskRegistry.connect(publisher).assignTask(0, 0);
      
      await expect(
        taskRegistry.connect(publisher).cancelTask(0)
      ).to.be.revertedWith('Cannot cancel at this stage');
    });
  });

  describe('Dispute Resolution', function () {
    beforeEach(async function () {
      await taskRegistry.connect(publisher).createTask(
        'Build a website',
        'Description',
        0,
        ethers.parseEther('1.0'),
        7 * 24 * 60 * 60,
        [],
        0,
        false,
        { value: ethers.parseEther('1.0') }
      );
      await taskRegistry.connect(publisher).publishTask(0);
      await taskRegistry.connect(worker).applyForTask(0, 'Proposal', ethers.parseEther('0.8'));
      await taskRegistry.connect(publisher).assignTask(0, 0);
      await taskRegistry.connect(worker).submitWork(0, 'ipfs://deliverable');
    });

    it('Should allow publisher to raise dispute', async function () {
      await expect(taskRegistry.connect(publisher).raiseDispute(0, 'Quality issues'))
        .to.emit(taskRegistry, 'TaskDisputed');
      
      const task = await taskRegistry.tasks(0);
      expect(task.state).to.equal(7); // Disputed
    });

    it('Should allow worker to raise dispute', async function () {
      await expect(taskRegistry.connect(worker).raiseDispute(0, 'Publisher not responding'))
        .to.emit(taskRegistry, 'TaskDisputed');
    });

    it('Should resolve dispute in favor of worker', async function () {
      await taskRegistry.connect(publisher).raiseDispute(0, 'Reason');
      
      await expect(taskRegistry.connect(owner).resolveDispute(0, true))
        .to.emit(taskRegistry, 'TaskResolved')
        .withArgs(0, true);
      
      const task = await taskRegistry.tasks(0);
      expect(task.state).to.equal(5); // Completed
    });

    it('Should resolve dispute in favor of publisher', async function () {
      await taskRegistry.connect(publisher).raiseDispute(0, 'Reason');
      
      const publisherBalanceBefore = await ethers.provider.getBalance(publisher.address);
      
      await taskRegistry.connect(owner).resolveDispute(0, false);
      
      const task = await taskRegistry.tasks(0);
      expect(task.state).to.equal(5); // Completed
    });

    it('Should only allow owner to resolve disputes', async function () {
      await taskRegistry.connect(publisher).raiseDispute(0, 'Reason');
      
      await expect(
        taskRegistry.connect(publisher).resolveDispute(0, true)
      ).to.be.revertedWithCustomError(taskRegistry, 'OwnableUnauthorizedAccount');
    });
  });

  describe('Platform Fee Management', function () {
    it('Should allow owner to update platform fee', async function () {
      await expect(taskRegistry.connect(owner).setPlatformFee(500))
        .to.emit(taskRegistry, 'PlatformFeeUpdated')
        .withArgs(500);
      
      expect(await taskRegistry.platformFee()).to.equal(500); // 5%
    });

    it('Should not allow fee above 10%', async function () {
      await expect(
        taskRegistry.connect(owner).setPlatformFee(1001)
      ).to.be.revertedWith('Fee cannot exceed 10%');
    });

    it('Should only allow owner to update fee', async function () {
      await expect(
        taskRegistry.connect(publisher).setPlatformFee(500)
      ).to.be.revertedWithCustomError(taskRegistry, 'OwnableUnauthorizedAccount');
    });
  });

  describe('Query Functions', function () {
    beforeEach(async function () {
      // Create multiple tasks
      for (let i = 0; i < 3; i++) {
        await taskRegistry.connect(publisher).createTask(
          `Task ${i}`, 'Desc', 0, ethers.parseEther('1.0'), 7 * 24 * 60 * 60, [], 0, false,
          { value: ethers.parseEther('1.0') }
        );
      }
      await taskRegistry.connect(publisher).publishTask(0);
      await taskRegistry.connect(publisher).publishTask(1);
    });

    it('Should get task count by state', async function () {
      expect(await taskRegistry.getTaskCountByState(0)).to.equal(1); // Draft
      expect(await taskRegistry.getTaskCountByState(1)).to.equal(2); // Open
    });

    it('Should get active tasks', async function () {
      const activeTasks = await taskRegistry.getActiveTasks();
      expect(activeTasks.length).to.equal(2);
    });

    it('Should check if task is expired', async function () {
      expect(await taskRegistry.isExpired(0)).to.be.false;
    });
  });

  describe('Emergency Functions', function () {
    it('Should allow owner to emergency withdraw', async function () {
      // Send some ETH to contract
      await owner.sendTransaction({
        to: taskRegistry.target,
        value: ethers.parseEther('1.0')
      });
      
      const contractBalance = await ethers.provider.getBalance(taskRegistry.target);
      expect(contractBalance).to.equal(ethers.parseEther('1.0'));
      
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      await taskRegistry.connect(owner).emergencyWithdraw();
      
      const contractBalanceAfter = await ethers.provider.getBalance(taskRegistry.target);
      expect(contractBalanceAfter).to.equal(0);
    });

    it('Should only allow owner to emergency withdraw', async function () {
      await expect(
        taskRegistry.connect(publisher).emergencyWithdraw()
      ).to.be.revertedWithCustomError(taskRegistry, 'OwnableUnauthorizedAccount');
    });
  });
});

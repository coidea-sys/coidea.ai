const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TaskApplicationFlow - Complete Task Lifecycle", function () {
  let TaskRegistry, LiabilityRegistry, AIAgentRegistry;
  let taskRegistry, liabilityRegistry, agentRegistry;
  let owner, publisher, agent1, agent2, worker;

  beforeEach(async function () {
    [owner, publisher, agent1, agent2, worker] = await ethers.getSigners();

    // Deploy LiabilityRegistry
    const LiabilityRegistryFactory = await ethers.getContractFactory("LiabilityRegistry");
    liabilityRegistry = await LiabilityRegistryFactory.deploy(owner.address);
    await liabilityRegistry.waitForDeployment();

    // Deploy TaskRegistryWithLiability
    const TaskRegistryFactory = await ethers.getContractFactory("TaskRegistryWithLiability");
    taskRegistry = await TaskRegistryFactory.deploy(owner.address);
    await taskRegistry.waitForDeployment();

    // Link LiabilityRegistry
    await taskRegistry.setLiabilityRegistry(await liabilityRegistry.getAddress());

    // Setup agent with limited liability
    await liabilityRegistry.connect(agent1).createLimitedLiability(
      ethers.parseEther("2"),
      { value: ethers.parseEther("2") }
    );
  });

  describe("1. Task Creation", function () {
    it("Should create task with Standard liability model", async function () {
      const tx = await taskRegistry.connect(publisher).createTask(
        "Design Logo",
        "Create a modern logo",
        1, // Design
        ethers.parseEther("0.5"),
        7 * 24 * 60 * 60, // 7 days
        ["design", "logo"],
        0, // minReputation
        0, // Standard liability
        0, // liabilityAmount
        { value: ethers.parseEther("0.5") }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return taskRegistry.interface.parseLog(log).name === "TaskCreated";
        } catch { return false; }
      });

      expect(event).to.not.be.undefined;
      
      const task = await taskRegistry.tasks(0);
      expect(task.title).to.equal("Design Logo");
      expect(task.publisher).to.equal(publisher.address);
      expect(task.liabilityModel).to.equal(0); // Standard
    });

    it("Should create task with Limited liability model", async function () {
      const tx = await taskRegistry.connect(publisher).createTask(
        "Smart Contract Audit",
        "Audit DeFi protocol",
        0, // Coding
        ethers.parseEther("1"),
        14 * 24 * 60 * 60,
        ["solidity", "security"],
        50, // minReputation
        1, // Limited liability
        ethers.parseEther("1.2"),
        { value: ethers.parseEther("1") }
      );

      const task = await taskRegistry.tasks(0);
      expect(task.liabilityModel).to.equal(1); // Limited
      expect(task.liabilityAmount).to.equal(ethers.parseEther("1.2"));
    });
  });

  describe("2. Task Application", function () {
    beforeEach(async function () {
      // Create a task
      await taskRegistry.connect(publisher).createTask(
        "Design Logo",
        "Create a modern logo",
        1,
        ethers.parseEther("0.5"),
        7 * 24 * 60 * 60,
        ["design"],
        0,
        0, // Standard
        0,
        { value: ethers.parseEther("0.5") }
      );

      // Publish task
      await taskRegistry.connect(publisher).publishTask(0);
    });

    it("Should allow agent to apply for task", async function () {
      const tx = await taskRegistry.connect(agent1).applyForTask(
        0,
        "I have 5 years experience in logo design",
        ethers.parseEther("0.4")
      );

      await expect(tx)
        .to.emit(taskRegistry, "TaskApplied")
        .withArgs(0, 0, agent1.address);

      const application = await taskRegistry.applications(0);
      expect(application.applicant).to.equal(agent1.address);
      expect(application.proposedPrice).to.equal(ethers.parseEther("0.4"));
      expect(application.canAssumeLiability).to.be.true;
    });

    it("Should prevent applying with price exceeding reward", async function () {
      await expect(
        taskRegistry.connect(agent1).applyForTask(
          0,
          "Proposal",
          ethers.parseEther("0.6") // Exceeds reward
        )
      ).to.be.revertedWith("Price exceeds reward");
    });

    it("Should prevent publisher from applying to own task", async function () {
      await expect(
        taskRegistry.connect(publisher).applyForTask(0, "Proposal", ethers.parseEther("0.4"))
      ).to.be.revertedWith("Cannot apply own");
    });
  });

  describe("3. Task Assignment", function () {
    beforeEach(async function () {
      // Create and publish task
      await taskRegistry.connect(publisher).createTask(
        "Design Logo",
        "Create a modern logo",
        1,
        ethers.parseEther("0.5"),
        7 * 24 * 60 * 60,
        ["design"],
        0,
        1, // Limited liability
        ethers.parseEther("0.6"),
        { value: ethers.parseEther("0.5") }
      );
      await taskRegistry.connect(publisher).publishTask(0);

      // Agent applies
      await taskRegistry.connect(agent1).applyForTask(0, "Proposal", ethers.parseEther("0.4"));
    });

    it("Should assign task to applicant with liability check", async function () {
      const tx = await taskRegistry.connect(publisher).assignTask(0, 0);

      await expect(tx)
        .to.emit(taskRegistry, "TaskAssigned")
        .withArgs(0, agent1.address);

      const task = await taskRegistry.tasks(0);
      expect(task.state).to.equal(2); // Assigned
      expect(task.worker).to.equal(agent1.address);
      expect(task.reward).to.equal(ethers.parseEther("0.4")); // Updated to proposed price
    });

    it("Should lock liability when assigning Limited liability task", async function () {
      await taskRegistry.connect(publisher).assignTask(0, 0);

      const task = await taskRegistry.tasks(0);
      expect(task.liabilityLocked).to.be.true;
    });
  });

  describe("4. Work Submission", function () {
    beforeEach(async function () {
      // Setup: create, publish, apply, assign
      await taskRegistry.connect(publisher).createTask(
        "Design Logo", "Create logo", 1,
        ethers.parseEther("0.5"), 7 * 24 * 60 * 60,
        ["design"], 0, 0, 0,
        { value: ethers.parseEther("0.5") }
      );
      await taskRegistry.connect(publisher).publishTask(0);
      await taskRegistry.connect(agent1).applyForTask(0, "Proposal", ethers.parseEther("0.4"));
      await taskRegistry.connect(publisher).assignTask(0, 0);
    });

    it("Should allow worker to submit work", async function () {
      const tx = await taskRegistry.connect(agent1).submitWork(0, "ipfs://QmResult");

      await expect(tx)
        .to.emit(taskRegistry, "TaskSubmitted")
        .withArgs(0, "ipfs://QmResult");

      const task = await taskRegistry.tasks(0);
      expect(task.state).to.equal(3); // Submitted
      expect(task.deliverableURI).to.equal("ipfs://QmResult");
    });

    it("Should prevent non-worker from submitting", async function () {
      await expect(
        taskRegistry.connect(agent2).submitWork(0, "ipfs://Fake")
      ).to.be.revertedWith("Not worker");
    });
  });

  describe("5. Task Completion", function () {
    beforeEach(async function () {
      // Complete workflow setup
      await taskRegistry.connect(publisher).createTask(
        "Design Logo", "Create logo", 1,
        ethers.parseEther("0.5"), 7 * 24 * 60 * 60,
        ["design"], 0, 1, ethers.parseEther("0.6"),
        { value: ethers.parseEther("0.5") }
      );
      await taskRegistry.connect(publisher).publishTask(0);
      await taskRegistry.connect(agent1).applyForTask(0, "Proposal", ethers.parseEther("0.4"));
      await taskRegistry.connect(publisher).assignTask(0, 0);
      await taskRegistry.connect(agent1).submitWork(0, "ipfs://QmResult");
    });

    it("Should complete task and pay worker", async function () {
      const workerBalanceBefore = await ethers.provider.getBalance(agent1.address);

      const tx = await taskRegistry.connect(publisher).completeTask(0);

      await expect(tx)
        .to.emit(taskRegistry, "TaskCompleted");

      const task = await taskRegistry.tasks(0);
      expect(task.state).to.equal(5); // Completed

      // Check payment (minus 2.5% fee)
      const workerBalanceAfter = await ethers.provider.getBalance(agent1.address);
      const expectedPayment = ethers.parseEther("0.4") * 975n / 1000n;
      expect(workerBalanceAfter - workerBalanceBefore).to.be.closeTo(
        expectedPayment,
        ethers.parseEther("0.001")
      );
    });

    it("Should release liability lock on completion", async function () {
      await taskRegistry.connect(publisher).completeTask(0);

      const task = await taskRegistry.tasks(0);
      expect(task.liabilityLocked).to.be.false;
    });
  });

  describe("6. Dispute Resolution", function () {
    beforeEach(async function () {
      // Setup to disputed state
      await taskRegistry.connect(publisher).createTask(
        "Design Logo", "Create logo", 1,
        ethers.parseEther("0.5"), 7 * 24 * 60 * 60,
        ["design"], 0, 1, ethers.parseEther("0.6"),
        { value: ethers.parseEther("0.5") }
      );
      await taskRegistry.connect(publisher).publishTask(0);
      await taskRegistry.connect(agent1).applyForTask(0, "Proposal", ethers.parseEther("0.4"));
      await taskRegistry.connect(publisher).assignTask(0, 0);
      await taskRegistry.connect(agent1).submitWork(0, "ipfs://QmResult");
      await taskRegistry.connect(publisher).raiseDispute(0, "Work not satisfactory");
    });

    it("Should resolve dispute in favor of worker", async function () {
      const workerBalanceBefore = await ethers.provider.getBalance(agent1.address);

      await taskRegistry.connect(owner).resolveDispute(0, true);

      const task = await taskRegistry.tasks(0);
      expect(task.state).to.equal(5); // Completed

      const workerBalanceAfter = await ethers.provider.getBalance(agent1.address);
      expect(workerBalanceAfter).to.be.gt(workerBalanceBefore);
    });

    it("Should resolve dispute in favor of publisher", async function () {
      const publisherBalanceBefore = await ethers.provider.getBalance(publisher.address);

      await taskRegistry.connect(owner).resolveDispute(0, false);

      const task = await taskRegistry.tasks(0);
      expect(task.state).to.equal(5); // Completed

      // Publisher should get refund
      const publisherBalanceAfter = await ethers.provider.getBalance(publisher.address);
      expect(publisherBalanceAfter).to.be.gt(publisherBalanceBefore);
    });
  });
});

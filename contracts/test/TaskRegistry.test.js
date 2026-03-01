const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TaskRegistry", function () {
  let taskRegistry;
  let owner, publisher, worker, other;

  beforeEach(async function () {
    [owner, publisher, worker, other] = await ethers.getSigners();
    
    const TaskRegistry = await ethers.getContractFactory("TaskRegistry");
    taskRegistry = await TaskRegistry.deploy(owner.address);
    await taskRegistry.waitForDeployment();
  });

  describe("Task Creation", function () {
    it("Should create a new task", async function () {
      const tx = await taskRegistry.connect(publisher).createTask(
        "Test Task",
        "Test Description",
        0, // Coding
        ethers.parseEther("1"),
        Math.floor(Date.now() / 1000) + 86400,
        ["solidity", "web3"],
        0,
        { value: ethers.parseEther("1.025") } // reward + 2.5% fee
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = taskRegistry.interface.parseLog(log);
          return parsed.name === "TaskCreated";
        } catch { return false; }
      });

      expect(event).to.not.be.undefined;
      
      const task = await taskRegistry.tasks(0);
      expect(task.title).to.equal("Test Task");
      expect(task.publisher).to.equal(publisher.address);
      expect(task.reward).to.equal(ethers.parseEther("1"));
    });

    it("Should not create task with insufficient deposit", async function () {
      await expect(
        taskRegistry.connect(publisher).createTask(
          "Test Task",
          "Test Description",
          0,
          ethers.parseEther("1"),
          Math.floor(Date.now() / 1000) + 86400,
          [],
          0,
          { value: ethers.parseEther("0.5") }
        )
      ).to.be.reverted;
    });

    it("Should not create task with past deadline", async function () {
      await expect(
        taskRegistry.connect(publisher).createTask(
          "Test Task",
          "Test Description",
          0,
          ethers.parseEther("1"),
          Math.floor(Date.now() / 1000) - 86400, // Past
          [],
          0,
          { value: ethers.parseEther("1.025") }
        )
      ).to.be.revertedWith("Invalid deadline");
    });
  });

  describe("Task Application", function () {
    beforeEach(async function () {
      await taskRegistry.connect(publisher).createTask(
        "Test Task",
        "Test Description",
        0,
        ethers.parseEther("1"),
        Math.floor(Date.now() / 1000) + 86400,
        [],
        0,
        { value: ethers.parseEther("1.025") }
      );
    });

    it("Should allow worker to apply", async function () {
      await taskRegistry.connect(worker).applyForTask(0, "I can do this!");
      
      const application = await taskRegistry.applications(0);
      expect(application.applicant).to.equal(worker.address);
      expect(application.proposal).to.equal("I can do this!");
    });

    it("Should not allow publisher to apply", async function () {
      await expect(
        taskRegistry.connect(publisher).applyForTask(0, "I want to do this")
      ).to.be.revertedWith("Cannot apply to own task");
    });

    it("Should not allow duplicate application", async function () {
      await taskRegistry.connect(worker).applyForTask(0, "First application");
      
      await expect(
        taskRegistry.connect(worker).applyForTask(0, "Second application")
      ).to.be.revertedWith("Already applied");
    });
  });

  describe("Task Assignment", function () {
    beforeEach(async function () {
      await taskRegistry.connect(publisher).createTask(
        "Test Task",
        "Test Description",
        0,
        ethers.parseEther("1"),
        Math.floor(Date.now() / 1000) + 86400,
        [],
        0,
        { value: ethers.parseEther("1.025") }
      );
      await taskRegistry.connect(worker).applyForTask(0, "I can do this!");
    });

    it("Should allow publisher to assign task", async function () {
      await taskRegistry.connect(publisher).assignTask(0, worker.address);
      
      const task = await taskRegistry.tasks(0);
      expect(task.state).to.equal(2); // Assigned
      expect(task.worker).to.equal(worker.address);
    });

    it("Should not allow non-publisher to assign", async function () {
      await expect(
        taskRegistry.connect(other).assignTask(0, worker.address)
      ).to.be.revertedWith("Only publisher can assign");
    });

    it("Should not assign to non-applicant", async function () {
      await expect(
        taskRegistry.connect(publisher).assignTask(0, other.address)
      ).to.be.revertedWith("Applicant not found");
    });
  });

  describe("Task Submission", function () {
    beforeEach(async function () {
      await taskRegistry.connect(publisher).createTask(
        "Test Task",
        "Test Description",
        0,
        ethers.parseEther("1"),
        Math.floor(Date.now() / 1000) + 86400,
        [],
        0,
        { value: ethers.parseEther("1.025") }
      );
      await taskRegistry.connect(worker).applyForTask(0, "I can do this!");
      await taskRegistry.connect(publisher).assignTask(0, worker.address);
    });

    it("Should allow worker to submit", async function () {
      await taskRegistry.connect(worker).submitWork(0, "ipfs://result");
      
      const task = await taskRegistry.tasks(0);
      expect(task.state).to.equal(3); // Submitted
      expect(task.deliverableURI).to.equal("ipfs://result");
    });

    it("Should not allow non-worker to submit", async function () {
      await expect(
        taskRegistry.connect(other).submitWork(0, "ipfs://fake")
      ).to.be.revertedWith("Only assigned worker can submit");
    });
  });

  describe("Task Completion", function () {
    beforeEach(async function () {
      await taskRegistry.connect(publisher).createTask(
        "Test Task",
        "Test Description",
        0,
        ethers.parseEther("1"),
        Math.floor(Date.now() / 1000) + 86400,
        [],
        0,
        { value: ethers.parseEther("1.025") }
      );
      await taskRegistry.connect(worker).applyForTask(0, "I can do this!");
      await taskRegistry.connect(publisher).assignTask(0, worker.address);
      await taskRegistry.connect(worker).submitWork(0, "ipfs://result");
    });

    it("Should complete task and pay worker", async function () {
      const workerBalanceBefore = await ethers.provider.getBalance(worker.address);
      
      await taskRegistry.connect(publisher).completeTask(0);
      
      const workerBalanceAfter = await ethers.provider.getBalance(worker.address);
      expect(workerBalanceAfter - workerBalanceBefore).to.equal(ethers.parseEther("1"));
      
      const task = await taskRegistry.tasks(0);
      expect(task.state).to.equal(5); // Completed
    });

    it("Should pay platform fee to fee recipient", async function () {
      const feeRecipientBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      await taskRegistry.connect(publisher).completeTask(0);
      
      const feeRecipientBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(ethers.parseEther("0.025"));
    });
  });

  describe("Task Cancellation", function () {
    beforeEach(async function () {
      await taskRegistry.connect(publisher).createTask(
        "Test Task",
        "Test Description",
        0,
        ethers.parseEther("1"),
        Math.floor(Date.now() / 1000) + 86400,
        [],
        0,
        { value: ethers.parseEther("1.025") }
      );
    });

    it("Should allow publisher to cancel", async function () {
      const publisherBalanceBefore = await ethers.provider.getBalance(publisher.address);
      
      const tx = await taskRegistry.connect(publisher).cancelTask(0);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      
      const publisherBalanceAfter = await ethers.provider.getBalance(publisher.address);
      expect(publisherBalanceAfter - publisherBalanceBefore + gasCost).to.equal(ethers.parseEther("1.025"));
      
      const task = await taskRegistry.tasks(0);
      expect(task.state).to.equal(6); // Cancelled
    });

    it("Should not allow non-publisher to cancel", async function () {
      await expect(
        taskRegistry.connect(other).cancelTask(0)
      ).to.be.revertedWith("Only publisher can cancel");
    });
  });
});

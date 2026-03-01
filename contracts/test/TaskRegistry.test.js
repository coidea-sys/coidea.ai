const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TaskRegistry", function () {
  let taskRegistry;
  let owner, publisher, worker, other;
  
  // Helper to get valid deadline (7 days from now)
  const getValidDeadline = () => Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

  beforeEach(async function () {
    [owner, publisher, worker, other] = await ethers.getSigners();
    
    const TaskRegistry = await ethers.getContractFactory("TaskRegistry");
    taskRegistry = await TaskRegistry.deploy(owner.address);
    await taskRegistry.waitForDeployment();
  });

  describe("Task Creation", function () {
    it("Should create a new task", async function () {
      const deadline = getValidDeadline();
      const tx = await taskRegistry.connect(publisher).createTask(
        "Test Task",
        "Test Description",
        0, // Coding
        ethers.parseEther("1"),
        deadline,
        ["solidity", "web3"],
        0,
        { value: ethers.parseEther("1.025") }
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
      expect(task.state).to.equal(1); // Open
    });

    it("Should not create task with insufficient deposit", async function () {
      await expect(
        taskRegistry.connect(publisher).createTask(
          "Test Task",
          "Test Description",
          0,
          ethers.parseEther("1"),
          getValidDeadline(),
          [],
          0,
          { value: ethers.parseEther("0.5") }
        )
      ).to.be.revertedWith("Insufficient deposit");
    });

    it("Should not create task with past deadline", async function () {
      await expect(
        taskRegistry.connect(publisher).createTask(
          "Test Task",
          "Test Description",
          0,
          ethers.parseEther("1"),
          Math.floor(Date.now() / 1000) - 86400,
          [],
          0,
          { value: ethers.parseEther("1.025") }
        )
      ).to.be.revertedWith("Deadline must be future");
    });

    it("Should not create task with deadline too far", async function () {
      await expect(
        taskRegistry.connect(publisher).createTask(
          "Test Task",
          "Test Description",
          0,
          ethers.parseEther("1"),
          Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year
          [],
          0,
          { value: ethers.parseEther("1.025") }
        )
      ).to.be.revertedWith("Deadline too far");
    });

    it("Should track publisher tasks", async function () {
      await taskRegistry.connect(publisher).createTask(
        "Task 1", "Desc", 0, ethers.parseEther("1"), getValidDeadline(), [], 0,
        { value: ethers.parseEther("1.025") }
      );
      
      await taskRegistry.connect(publisher).createTask(
        "Task 2", "Desc", 0, ethers.parseEther("2"), getValidDeadline(), [], 0,
        { value: ethers.parseEther("2.05") }
      );

      const tasks = await taskRegistry.getPublisherTasks(publisher.address);
      expect(tasks.length).to.equal(2);
      expect(tasks[0]).to.equal(0);
      expect(tasks[1]).to.equal(1);
    });
  });

  describe("Task Application", function () {
    beforeEach(async function () {
      await taskRegistry.connect(publisher).createTask(
        "Test Task",
        "Test Description",
        0,
        ethers.parseEther("1"),
        getValidDeadline(),
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
      expect(application.state).to.equal(0); // Pending
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

    it("Should track task applications", async function () {
      await taskRegistry.connect(worker).applyForTask(0, "Proposal 1");
      await taskRegistry.connect(other).applyForTask(0, "Proposal 2");

      const applications = await taskRegistry.getTaskApplications(0);
      expect(applications.length).to.equal(2);
    });
  });

  describe("Task Assignment", function () {
    beforeEach(async function () {
      await taskRegistry.connect(publisher).createTask(
        "Test Task",
        "Test Description",
        0,
        ethers.parseEther("1"),
        getValidDeadline(),
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
      expect(task.assignedAt).to.be.gt(0);
    });

    it("Should not allow non-publisher to assign", async function () {
      await expect(
        taskRegistry.connect(other).assignTask(0, worker.address)
      ).to.be.revertedWith("Only publisher can assign");
    });

    it("Should not assign to non-applicant", async function () {
      await expect(
        taskRegistry.connect(publisher).assignTask(0, other.address)
      ).to.be.revertedWith("Worker did not apply");
    });

    it("Should not assign already assigned task", async function () {
      await taskRegistry.connect(publisher).assignTask(0, worker.address);
      
      await expect(
        taskRegistry.connect(publisher).assignTask(0, worker.address)
      ).to.be.revertedWith("Task not open");
    });
  });

  describe("Task Submission", function () {
    beforeEach(async function () {
      await taskRegistry.connect(publisher).createTask(
        "Test Task",
        "Test Description",
        0,
        ethers.parseEther("1"),
        getValidDeadline(),
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
      expect(task.submittedAt).to.be.gt(0);
    });

    it("Should not allow non-worker to submit", async function () {
      await expect(
        taskRegistry.connect(other).submitWork(0, "ipfs://fake")
      ).to.be.revertedWith("Only assigned worker can submit");
    });

    it("Should not submit twice", async function () {
      await taskRegistry.connect(worker).submitWork(0, "ipfs://result1");
      
      await expect(
        taskRegistry.connect(worker).submitWork(0, "ipfs://result2")
      ).to.be.revertedWith("Task not assigned");
    });
  });

  describe("Task Completion", function () {
    beforeEach(async function () {
      await taskRegistry.connect(publisher).createTask(
        "Test Task",
        "Test Description",
        0,
        ethers.parseEther("1"),
        getValidDeadline(),
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
      expect(task.completedAt).to.be.gt(0);
    });

    it("Should pay platform fee to fee recipient", async function () {
      const feeRecipientBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      await taskRegistry.connect(publisher).completeTask(0);
      
      const feeRecipientBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(ethers.parseEther("0.025"));
    });

    it("Should track worker tasks", async function () {
      await taskRegistry.connect(publisher).completeTask(0);
      
      const tasks = await taskRegistry.getWorkerTasks(worker.address);
      expect(tasks.length).to.equal(1);
      expect(tasks[0]).to.equal(0);
    });

    it("Should not allow non-publisher to complete", async function () {
      await expect(
        taskRegistry.connect(other).completeTask(0)
      ).to.be.revertedWith("Only publisher can complete");
    });

    it("Should not complete unsubmitted task", async function () {
      // Create new task
      await taskRegistry.connect(publisher).createTask(
        "Task 2", "Desc", 0, ethers.parseEther("1"), getValidDeadline(), [], 0,
        { value: ethers.parseEther("1.025") }
      );
      await taskRegistry.connect(worker).applyForTask(1, "I can do this!");
      await taskRegistry.connect(publisher).assignTask(1, worker.address);
      
      await expect(
        taskRegistry.connect(publisher).completeTask(1)
      ).to.be.revertedWith("Task not submitted");
    });
  });

  describe("Task Cancellation", function () {
    beforeEach(async function () {
      await taskRegistry.connect(publisher).createTask(
        "Test Task",
        "Test Description",
        0,
        ethers.parseEther("1"),
        getValidDeadline(),
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

    it("Should not cancel assigned task", async function () {
      await taskRegistry.connect(worker).applyForTask(0, "I can do this!");
      await taskRegistry.connect(publisher).assignTask(0, worker.address);
      
      await expect(
        taskRegistry.connect(publisher).cancelTask(0)
      ).to.be.revertedWith("Task not open");
    });
  });

  describe("Platform Fee", function () {
    it("Should allow owner to update fee", async function () {
      await taskRegistry.connect(owner).setPlatformFee(500); // 5%
      expect(await taskRegistry.platformFee()).to.equal(500);
    });

    it("Should not allow non-owner to update fee", async function () {
      await expect(
        taskRegistry.connect(publisher).setPlatformFee(500)
      ).to.be.revertedWithCustomError(taskRegistry, "OwnableUnauthorizedAccount");
    });

    it("Should not set fee above 10%", async function () {
      await expect(
        taskRegistry.connect(owner).setPlatformFee(1500)
      ).to.be.revertedWith("Fee cannot exceed 10%");
    });
  });
});

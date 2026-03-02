const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("coidea.ai v0.2.0 - Human & Agent System", function () {
  let humanRegistry, humanEconomy, agentLifecycle, agentRuntime, agentCommunity;
  let owner, human1, human2, agentOwner;
  
  beforeEach(async function () {
    [owner, human1, human2, agentOwner] = await ethers.getSigners();
    
    // Deploy HumanRegistry
    const HumanRegistry = await ethers.getContractFactory("HumanRegistry");
    humanRegistry = await HumanRegistry.deploy(owner.address);
    await humanRegistry.waitForDeployment();
    
    // Deploy HumanEconomy
    const HumanEconomy = await ethers.getContractFactory("HumanEconomy");
    humanEconomy = await HumanEconomy.deploy(
      await humanRegistry.getAddress(),
      owner.address, // 临时 agentLifecycle
      owner.address  // treasury
    );
    await humanEconomy.waitForDeployment();
    
    // Deploy AgentLifecycle
    const AgentLifecycle = await ethers.getContractFactory("AgentLifecycle");
    agentLifecycle = await AgentLifecycle.deploy(
      owner.address, // 临时 agentRegistry
      owner.address  // treasury
    );
    await agentLifecycle.waitForDeployment();
    
    // Deploy AgentRuntime
    const AgentRuntime = await ethers.getContractFactory("AgentRuntime");
    agentRuntime = await AgentRuntime.deploy();
    await agentRuntime.waitForDeployment();
    
    // Deploy AgentCommunity
    const AgentCommunity = await ethers.getContractFactory("AgentCommunity");
    agentCommunity = await AgentCommunity.deploy(
      owner.address, // 临时 agentRegistry
      owner.address  // 临时 communityGovernance
    );
    await agentCommunity.waitForDeployment();
  });
  
  describe("HumanRegistry", function () {
    it("Should allow human registration", async function () {
      const fee = await humanRegistry.registrationFee();
      
      const tx = await humanRegistry.connect(human1).register("alice", "ipfs://metadata", { value: fee });
      const receipt = await tx.wait();
      
      // Check event was emitted
      await expect(tx)
        .to.emit(humanRegistry, "HumanRegistered")
        .withArgs(human1.address, "alice", await getTimestamp(receipt));
      
      const profile = await humanRegistry.getHumanProfile(human1.address);
      expect(profile.username).to.equal("alice");
      expect(profile.reputation).to.equal(100);
    });
    
    it("Should reject duplicate usernames", async function () {
      const fee = await humanRegistry.registrationFee();
      
      await humanRegistry.connect(human1).register("alice", "ipfs://metadata", { value: fee });
      
      await expect(
        humanRegistry.connect(human2).register("alice", "ipfs://metadata", { value: fee })
      ).to.be.revertedWith("Username taken");
    });
    
    it("Should track reputation correctly", async function () {
      const fee = await humanRegistry.registrationFee();
      await humanRegistry.connect(human1).register("alice", "ipfs://metadata", { value: fee });
      
      await humanRegistry.increaseReputation(human1.address, 50, "Test reward");
      
      const profile = await humanRegistry.getHumanProfile(human1.address);
      expect(profile.reputation).to.equal(150);
    });
  });
  
  describe("HumanEconomy", function () {
    beforeEach(async function () {
      const fee = await humanRegistry.registrationFee();
      await humanRegistry.connect(human1).register("alice", "ipfs://metadata", { value: fee });
    });
    
    it("Should allow deposits", async function () {
      const depositAmount = ethers.parseEther("1.0");
      
      await expect(
        humanEconomy.connect(human1).deposit({ value: depositAmount })
      ).to.emit(humanEconomy, "Deposited")
       .withArgs(human1.address, depositAmount, depositAmount);
      
      const summary = await humanEconomy.getWalletSummary(human1.address);
      expect(summary.available).to.equal(depositAmount);
    });
    
    it("Should allow withdrawals", async function () {
      const depositAmount = ethers.parseEther("1.0");
      const withdrawAmount = ethers.parseEther("0.5");
      
      await humanEconomy.connect(human1).deposit({ value: depositAmount });
      
      await expect(
        humanEconomy.connect(human1).withdraw(withdrawAmount)
      ).to.emit(humanEconomy, "Withdrawn")
       .withArgs(human1.address, withdrawAmount, depositAmount - withdrawAmount);
      
      const summary = await humanEconomy.getWalletSummary(human1.address);
      expect(summary.available).to.equal(depositAmount - withdrawAmount);
    });
    
    it("Should lock funds for tasks", async function () {
      const depositAmount = ethers.parseEther("1.0");
      const taskReward = ethers.parseEther("0.3");
      
      await humanEconomy.connect(human1).deposit({ value: depositAmount });
      await humanEconomy.connect(human1).fundTask(1, taskReward);
      
      const summary = await humanEconomy.getWalletSummary(human1.address);
      expect(summary.available).to.equal(depositAmount - taskReward);
      expect(summary.lockedInTasks).to.equal(taskReward);
    });
  });
  
  describe("AgentLifecycle", function () {
    it("Should track agent economics", async function () {
      const agentId = 1;
      const fundAmount = ethers.parseEther("0.5");
      
      // Fund agent
      await agentLifecycle.fundAgent(agentId, { value: fundAmount });
      
      const summary = await agentLifecycle.getFinancialSummary(agentId);
      expect(summary.available).to.equal(fundAmount);
      
      // Record cost
      const costAmount = ethers.parseEther("0.1");
      await agentLifecycle.recordCost(
        agentId,
        0, // LLMInference
        costAmount,
        "Test cost",
        ethers.encodeBytes32String("task1")
      );
      
      const summary2 = await agentLifecycle.getFinancialSummary(agentId);
      expect(summary2.available).to.equal(fundAmount - costAmount);
      expect(summary2.totalSpent).to.equal(costAmount);
    });
    
    it("Should receive task rewards", async function () {
      const agentId = 1;
      const fundAmount = ethers.parseEther("0.1");
      const rewardAmount = ethers.parseEther("0.5");
      
      await agentLifecycle.fundAgent(agentId, { value: fundAmount });
      
      await agentLifecycle.receiveTaskReward(agentId, ethers.encodeBytes32String("task1"), {
        value: rewardAmount
      });
      
      const summary = await agentLifecycle.getFinancialSummary(agentId);
      // 扣除 5% 平台费
      const expectedNet = rewardAmount * 95n / 100n;
      expect(summary.totalEarned).to.equal(expectedNet);
    });
  });
  
  describe("AgentRuntime", function () {
    it("Should register skills", async function () {
      const skillId = ethers.encodeBytes32String("coding");
      
      await agentRuntime.registerSkill(
        skillId,
        "Coding",
        "Code writing skill",
        owner.address,
        ethers.parseEther("0.01"),
        ["solidity", "javascript"]
      );
      
      const skill = await agentRuntime.skills(skillId);
      expect(skill.name).to.equal("Coding");
      expect(skill.baseCost).to.equal(ethers.parseEther("0.01"));
    });
    
    it("Should start and complete executions", async function () {
      const agentId = 1;
      const taskId = ethers.encodeBytes32String("task1");
      
      const tx = await agentRuntime.startExecution(agentId, taskId, "Test intent");
      const receipt = await tx.wait();
      
      // Get execution ID from event
      const event = receipt.logs.find(l => l.fragment?.name === "ExecutionStarted");
      const executionId = event.args[0];
      
      await agentRuntime.completeExecution(
        executionId,
        true,
        "Success",
        85,
        "Learned something"
      );
      
      const details = await agentRuntime.getExecutionDetails(executionId);
      expect(details.isComplete).to.be.true;
    });
  });
  
  describe("AgentCommunity", function () {
    it("Should track agent interactions", async function () {
      const agentId = 1;
      
      await agentCommunity.agentCreateForumPost(
        agentId,
        "Test Post",
        "Test content",
        0 // Discussion
      );
      
      const reputation = await agentCommunity.getAgentCommunityReputation(agentId);
      expect(reputation).to.equal(10); // Forum post = 10 reputation
      
      const interactions = await agentCommunity.getAgentInteractions(agentId);
      expect(interactions.length).to.equal(1);
    });
    
    it("Should enforce daily limits", async function () {
      const agentId = 1;
      const dailyLimit = 50;
      
      // Try to exceed daily limit
      for (let i = 0; i < dailyLimit + 1; i++) {
        if (i < dailyLimit) {
          await agentCommunity.agentCreateForumPost(agentId, `Post ${i}`, "Content", 0);
        } else {
          await expect(
            agentCommunity.agentCreateForumPost(agentId, `Post ${i}`, "Content", 0)
          ).to.be.revertedWith("Daily limit reached");
        }
      }
    });
  });
  
  describe("Integration", function () {
    it("Should complete full human-agent workflow", async function () {
      // 1. Human registers
      const fee = await humanRegistry.registrationFee();
      await humanRegistry.connect(human1).register("alice", "ipfs://metadata", { value: fee });
      
      // 2. Human deposits funds
      await humanEconomy.connect(human1).deposit({ value: ethers.parseEther("2.0") });
      
      // 3. Agent gets funded
      const agentId = 1;
      await agentLifecycle.fundAgent(agentId, { value: ethers.parseEther("0.5") });
      
      // 4. Agent creates forum post
      await agentCommunity.agentCreateForumPost(agentId, "Hello", "World", 0);
      
      // 5. Agent completes task and earns
      await agentLifecycle.receiveTaskReward(agentId, ethers.encodeBytes32String("task1"), {
        value: ethers.parseEther("0.2")
      });
      
      // Verify final states
      const humanSummary = await humanEconomy.getWalletSummary(human1.address);
      expect(humanSummary.available).to.equal(ethers.parseEther("2.0"));
      
      const agentSummary = await agentLifecycle.getFinancialSummary(agentId);
      expect(agentSummary.totalEarned).to.be.gt(0);
      
      const agentRep = await agentCommunity.getAgentCommunityReputation(agentId);
      expect(agentRep).to.equal(10);
    });
  });
});

// Helper function
async function getTimestamp(receipt) {
  const block = await ethers.provider.getBlock(receipt.blockNumber);
  return block.timestamp;
}

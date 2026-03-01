const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LiabilityRegistry - Agent Liability System", function () {
  let LiabilityRegistry;
  let registry;
  let owner, agent, insurer, claimant, jointHolder1, jointHolder2;

  beforeEach(async function () {
    [owner, agent, insurer, claimant, jointHolder1, jointHolder2] = await ethers.getSigners();
    
    LiabilityRegistry = await ethers.getContractFactory("LiabilityRegistry");
    registry = await LiabilityRegistry.deploy(owner.address);
    await registry.waitForDeployment();
  });

  describe("Profile Creation", function () {
    it("Should create limited liability profile with stake", async function () {
      const maxLiability = ethers.parseEther("1");
      
      await expect(
        registry.connect(agent).createLimitedLiability(maxLiability, { value: maxLiability })
      ).to.emit(registry, "ProfileCreated")
        .withArgs(agent.address, 0, maxLiability); // 0 = Limited
      
      const profile = await registry.profiles(agent.address);
      expect(profile.liabilityType).to.equal(0); // Limited
      expect(profile.maxLiability).to.equal(maxLiability);
      expect(profile.stakedAmount).to.equal(maxLiability);
      expect(profile.isActive).to.be.true;
    });

    it("Should reject limited liability without sufficient stake", async function () {
      const maxLiability = ethers.parseEther("1");
      
      await expect(
        registry.connect(agent).createLimitedLiability(maxLiability, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Must stake max liability amount");
    });

    it("Should create unlimited liability profile", async function () {
      await expect(registry.connect(agent).createUnlimitedLiability())
        .to.emit(registry, "ProfileCreated")
        .withArgs(agent.address, 1, ethers.MaxUint256); // 1 = Unlimited
      
      const profile = await registry.profiles(agent.address);
      expect(profile.liabilityType).to.equal(1); // Unlimited
      expect(profile.maxLiability).to.equal(ethers.MaxUint256);
    });

    it("Should create insured liability profile", async function () {
      await registry.addApprovedInsurer(insurer.address);
      
      const coverage = ethers.parseEther("10");
      const premiumRate = 500; // 5%
      const premium = coverage * BigInt(premiumRate) / 10000n;
      
      await expect(
        registry.connect(agent).createInsuredLiability(insurer.address, coverage, premiumRate, { value: premium })
      ).to.emit(registry, "ProfileCreated")
        .withArgs(agent.address, 2, coverage); // 2 = Insured
      
      const profile = await registry.profiles(agent.address);
      expect(profile.liabilityType).to.equal(2); // Insured
      expect(profile.insurer).to.equal(insurer.address);
      expect(profile.insurancePremium).to.equal(premiumRate);
    });

    it("Should create joint liability profile", async function () {
      const holders = [jointHolder1.address, jointHolder2.address];
      const shares = [6000, 4000]; // 60% / 40%
      
      await expect(
        registry.connect(agent).createJointLiability(holders, shares, { value: ethers.parseEther("1") })
      ).to.emit(registry, "ProfileCreated")
        .withArgs(agent.address, 3, ethers.MaxUint256); // 3 = Joint
      
      const profile = await registry.profiles(agent.address);
      expect(profile.liabilityType).to.equal(3); // Joint
      expect(profile.isActive).to.be.true;
    });

    it("Should reject duplicate profile creation", async function () {
      await registry.connect(agent).createUnlimitedLiability();
      
      await expect(registry.connect(agent).createUnlimitedLiability())
        .to.be.revertedWith("Profile already exists");
    });
  });

  describe("Stake Management", function () {
    beforeEach(async function () {
      await registry.connect(agent).createLimitedLiability(ethers.parseEther("1"), {
        value: ethers.parseEther("1")
      });
    });

    it("Should allow adding stake", async function () {
      const additionalStake = ethers.parseEther("0.5");
      
      await expect(registry.connect(agent).addStake({ value: additionalStake }))
        .to.not.be.reverted;
      
      const profile = await registry.profiles(agent.address);
      expect(profile.stakedAmount).to.equal(ethers.parseEther("1.5"));
    });

    it("Should allow reducing stake while maintaining minimum", async function () {
      await registry.connect(agent).addStake({ value: ethers.parseEther("0.5") });
      
      await expect(registry.connect(agent).reduceStake(ethers.parseEther("0.3")))
        .to.not.be.reverted;
      
      const profile = await registry.profiles(agent.address);
      expect(profile.stakedAmount).to.equal(ethers.parseEther("1.2"));
    });

    it("Should prevent reducing below max liability for limited profiles", async function () {
      await expect(registry.connect(agent).reduceStake(ethers.parseEther("0.1")))
        .to.be.revertedWith("Must maintain max liability stake");
    });
  });

  describe("Liability Locking", function () {
    beforeEach(async function () {
      await registry.connect(agent).createLimitedLiability(ethers.parseEther("2"), {
        value: ethers.parseEther("2")
      });
    });

    it("Should lock liability for task", async function () {
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("task1"));
      const amount = ethers.parseEther("1");
      
      await expect(registry.lockLiability(agent.address, taskId, amount))
        .to.emit(registry, "LiabilityLocked")
        .withArgs(taskId, agent.address, amount);
      
      const locked = await registry.lockedLiability(taskId);
      expect(locked).to.equal(amount);
    });

    it("Should prevent locking exceeding max liability", async function () {
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("task1"));
      const amount = ethers.parseEther("3"); // Exceeds max liability
      
      await expect(registry.lockLiability(agent.address, taskId, amount))
        .to.be.revertedWith("Exceeds max liability");
    });

    it("Should release liability after task completion", async function () {
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("task1"));
      const amount = ethers.parseEther("1");
      
      await registry.lockLiability(agent.address, taskId, amount);
      
      // releaseLiability 使用 msg.sender 作为 agent 参数
      await expect(registry.connect(agent).releaseLiability(taskId))
        .to.emit(registry, "LiabilityReleased")
        .withArgs(taskId, agent.address, amount);
      
      const locked = await registry.lockedLiability(taskId);
      expect(locked).to.equal(0);
    });
  });

  describe("Liability Capability Check", function () {
    it("Should return false for agents without profile", async function () {
      const canAssume = await registry.canAssumeLiability(agent.address, ethers.parseEther("1"));
      expect(canAssume).to.be.false;
    });

    it("Should return true for unlimited liability", async function () {
      await registry.connect(agent).createUnlimitedLiability();
      
      const canAssume = await registry.canAssumeLiability(agent.address, ethers.parseEther("100"));
      expect(canAssume).to.be.true;
    });

    it("Should check stake amount for limited liability", async function () {
      await registry.connect(agent).createLimitedLiability(ethers.parseEther("2"), {
        value: ethers.parseEther("2")
      });
      
      expect(await registry.canAssumeLiability(agent.address, ethers.parseEther("1"))).to.be.true;
      expect(await registry.canAssumeLiability(agent.address, ethers.parseEther("3"))).to.be.false;
    });

    it("Should check coverage for insured liability", async function () {
      await registry.addApprovedInsurer(insurer.address);
      const coverage = ethers.parseEther("5");
      const premium = coverage * 500n / 10000n;
      
      await registry.connect(agent).createInsuredLiability(insurer.address, coverage, 500, { value: premium });
      
      expect(await registry.canAssumeLiability(agent.address, ethers.parseEther("3"))).to.be.true;
      expect(await registry.canAssumeLiability(agent.address, ethers.parseEther("6"))).to.be.false;
    });
  });

  describe("Liability Execution (Dispute Resolution)", function () {
    beforeEach(async function () {
      await registry.connect(agent).createLimitedLiability(ethers.parseEther("2"), {
        value: ethers.parseEther("2")
      });
    });

    it("Should execute liability payment from stake", async function () {
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("task1"));
      const amount = ethers.parseEther("1");
      
      await registry.lockLiability(agent.address, taskId, amount);
      
      const claimantBalanceBefore = await ethers.provider.getBalance(claimant.address);
      
      await expect(registry.executeLiability(taskId, agent.address, claimant.address, amount, "Task failed"))
        .to.emit(registry, "LiabilityClaimed")
        .withArgs(taskId, claimant.address, amount, "Task failed");
      
      const claimantBalanceAfter = await ethers.provider.getBalance(claimant.address);
      expect(claimantBalanceAfter - claimantBalanceBefore).to.equal(amount);
      
      const profile = await registry.profiles(agent.address);
      expect(profile.stakedAmount).to.equal(ethers.parseEther("1")); // 2 - 1
    });

    it("Should only allow owner to execute liability", async function () {
      const taskId = ethers.keccak256(ethers.toUtf8Bytes("task1"));
      
      await expect(
        registry.connect(agent).executeLiability(taskId, agent.address, claimant.address, 100, "test")
      ).to.be.revertedWith("Not owner");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to add approved insurers", async function () {
      await registry.addApprovedInsurer(insurer.address);
      expect(await registry.approvedInsurers(insurer.address)).to.be.true;
    });

    it("Should allow owner to remove approved insurers", async function () {
      await registry.addApprovedInsurer(insurer.address);
      await registry.removeApprovedInsurer(insurer.address);
      expect(await registry.approvedInsurers(insurer.address)).to.be.false;
    });

    it("Should allow owner to update platform fee", async function () {
      await registry.setPlatformFeeRate(100); // 1%
      expect(await registry.platformFeeRate()).to.equal(100);
    });

    it("Should prevent fee above 5%", async function () {
      await expect(registry.setPlatformFeeRate(600))
        .to.be.revertedWith("Fee too high");
    });
  });
});

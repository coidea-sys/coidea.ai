const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LiabilityPreset", function () {
  let liabilityPreset;
  let owner, publisher, worker, insuranceProvider, taskRegistry;
  
  const STANDARD_PRESET = ethers.keccak256(ethers.toUtf8Bytes("STANDARD"));
  const LIMITED_PRESET = ethers.keccak256(ethers.toUtf8Bytes("LIMITED"));
  const INSURED_PRESET = ethers.keccak256(ethers.toUtf8Bytes("INSURED"));
  const BONDED_PRESET = ethers.keccak256(ethers.toUtf8Bytes("BONDED"));

  beforeEach(async function () {
    [owner, publisher, worker, insuranceProvider, taskRegistry] = await ethers.getSigners();
    
    const LiabilityPreset = await ethers.getContractFactory("LiabilityPreset");
    liabilityPreset = await LiabilityPreset.deploy();
    await liabilityPreset.waitForDeployment();
    
    // Authorize task registry
    await liabilityPreset.authorizeRegistry(taskRegistry.address);
    
    // Create presets
    await liabilityPreset.createStandardPreset(STANDARD_PRESET, 7 * 24 * 60 * 60);
    await liabilityPreset.createLimitedPreset(
      LIMITED_PRESET,
      ethers.parseEther("0.05"),
      ethers.parseEther("0.02"),
      7 * 24 * 60 * 60
    );
    await liabilityPreset.createInsuredPreset(
      INSURED_PRESET,
      ethers.parseEther("0.1"),
      ethers.parseEther("0.01"),
      insuranceProvider.address,
      7 * 24 * 60 * 60
    );
    await liabilityPreset.createBondedPreset(
      BONDED_PRESET,
      ethers.parseEther("0.1"),
      ethers.parseEther("0.1"),
      7 * 24 * 60 * 60
    );
  });

  describe("Preset Creation", function () {
    it("Should create Standard preset", async function () {
      const preset = await liabilityPreset.presets(STANDARD_PRESET);
      expect(preset.model).to.equal(0);
      expect(preset.publisherLiability).to.equal(0);
      expect(preset.workerLiability).to.equal(0);
      expect(preset.enabled).to.be.true;
    });

    it("Should create Limited preset", async function () {
      const preset = await liabilityPreset.presets(LIMITED_PRESET);
      expect(preset.model).to.equal(1);
      expect(preset.publisherLiability).to.equal(ethers.parseEther("0.05"));
      expect(preset.workerLiability).to.equal(ethers.parseEther("0.02"));
    });

    it("Should create Insured preset", async function () {
      const preset = await liabilityPreset.presets(INSURED_PRESET);
      expect(preset.model).to.equal(2);
      expect(preset.publisherLiability).to.equal(ethers.parseEther("0.1"));
      expect(preset.insurancePremium).to.equal(ethers.parseEther("0.01"));
      expect(preset.insuranceProvider).to.equal(insuranceProvider.address);
    });

    it("Should create Bonded preset", async function () {
      const preset = await liabilityPreset.presets(BONDED_PRESET);
      expect(preset.model).to.equal(3);
      expect(preset.publisherLiability).to.equal(ethers.parseEther("0.1"));
      expect(preset.workerLiability).to.equal(ethers.parseEther("0.1"));
    });

    it("Should not allow duplicate preset", async function () {
      await expect(
        liabilityPreset.createStandardPreset(STANDARD_PRESET, 86400)
      ).to.be.revertedWith("Preset already exists");
    });
  });

  describe("Apply Preset (via authorized registry)", function () {
    it("Should apply Standard preset without payment", async function () {
      await liabilityPreset.connect(taskRegistry).applyPreset(1, STANDARD_PRESET, publisher.address);
      const taskPreset = await liabilityPreset.taskPresets(1);
      expect(taskPreset).to.equal(STANDARD_PRESET);
    });

    it("Should apply Limited preset with publisher liability", async function () {
      await expect(
        liabilityPreset.connect(taskRegistry).applyPreset(1, LIMITED_PRESET, publisher.address)
      ).to.be.revertedWith("Insufficient liability deposit");

      await liabilityPreset.connect(taskRegistry).applyPreset(1, LIMITED_PRESET, publisher.address, {
        value: ethers.parseEther("0.05")
      });

      const escrow = await liabilityPreset.getEscrowBalance(1, publisher.address);
      expect(escrow).to.equal(ethers.parseEther("0.05"));
    });

    it("Should apply Insured preset with insurance premium", async function () {
      const providerBalanceBefore = await ethers.provider.getBalance(insuranceProvider.address);
      
      await liabilityPreset.connect(taskRegistry).applyPreset(1, INSURED_PRESET, publisher.address, {
        value: ethers.parseEther("0.11")
      });

      const providerBalanceAfter = await ethers.provider.getBalance(insuranceProvider.address);
      expect(providerBalanceAfter - providerBalanceBefore).to.equal(ethers.parseEther("0.01"));
    });

    it("Should not allow unauthorized registry", async function () {
      await expect(
        liabilityPreset.connect(publisher).applyPreset(1, STANDARD_PRESET, publisher.address)
      ).to.be.revertedWith("Not authorized registry");
    });
  });

  describe("Worker Liability", function () {
    beforeEach(async function () {
      await liabilityPreset.connect(taskRegistry).applyPreset(1, BONDED_PRESET, publisher.address, {
        value: ethers.parseEther("0.1")
      });
    });

    it("Should require worker deposit for Bonded preset", async function () {
      const [required, amount] = await liabilityPreset.requiresWorkerDeposit(1);
      expect(required).to.be.true;
      expect(amount).to.equal(ethers.parseEther("0.1"));
    });

    it("Should accept worker liability deposit", async function () {
      await liabilityPreset.connect(worker).depositWorkerLiability(1, {
        value: ethers.parseEther("0.1")
      });

      const escrow = await liabilityPreset.getEscrowBalance(1, worker.address);
      expect(escrow).to.equal(ethers.parseEther("0.1"));
    });

    it("Should not accept deposit for non-Bonded preset", async function () {
      await liabilityPreset.connect(taskRegistry).applyPreset(2, LIMITED_PRESET, publisher.address, {
        value: ethers.parseEther("0.05")
      });

      await expect(
        liabilityPreset.connect(worker).depositWorkerLiability(2, {
          value: ethers.parseEther("0.02")
        })
      ).to.be.revertedWith("Not bonded mode");
    });
  });

  describe("Release Liability", function () {
    it("Should release liability on task completion", async function () {
      await liabilityPreset.connect(taskRegistry).applyPreset(1, LIMITED_PRESET, publisher.address, {
        value: ethers.parseEther("0.05")
      });

      const balanceBefore = await ethers.provider.getBalance(publisher.address);
      
      await liabilityPreset.connect(taskRegistry).releaseLiability(1, publisher.address, worker.address);
      
      const balanceAfter = await ethers.provider.getBalance(publisher.address);
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("0.05"));

      const escrow = await liabilityPreset.getEscrowBalance(1, publisher.address);
      expect(escrow).to.equal(0);
    });

    it("Should release both deposits for Bonded preset", async function () {
      await liabilityPreset.connect(taskRegistry).applyPreset(1, BONDED_PRESET, publisher.address, {
        value: ethers.parseEther("0.1")
      });
      await liabilityPreset.connect(worker).depositWorkerLiability(1, {
        value: ethers.parseEther("0.1")
      });

      await liabilityPreset.connect(taskRegistry).releaseLiability(1, publisher.address, worker.address);

      const publisherEscrow = await liabilityPreset.getEscrowBalance(1, publisher.address);
      const workerEscrow = await liabilityPreset.getEscrowBalance(1, worker.address);
      
      expect(publisherEscrow).to.equal(0);
      expect(workerEscrow).to.equal(0);
    });
  });

  describe("Slash Liability", function () {
    it("Should slash liability for disputed party", async function () {
      await liabilityPreset.connect(taskRegistry).applyPreset(1, LIMITED_PRESET, publisher.address, {
        value: ethers.parseEther("0.05")
      });

      const recipientBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      await liabilityPreset.connect(taskRegistry).slashLiability(1, publisher.address, owner.address);
      
      const recipientBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(ethers.parseEther("0.05"));
    });
  });
});

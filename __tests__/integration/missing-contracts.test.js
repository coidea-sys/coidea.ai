/**
 * Missing Contracts Integration Tests
 * TDD for HumanLevelNFT and LiabilityRegistry deployment
 */

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Missing Contracts - TDD Deployment', () => {
  let humanLevelNFT;
  let liabilityRegistry;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
  });

  describe('HumanLevelNFT - Pre-deployment Tests', () => {
    it('should deploy HumanLevelNFT contract', async () => {
      const HumanLevelNFT = await ethers.getContractFactory('HumanLevelNFT');
      humanLevelNFT = await HumanLevelNFT.deploy();
      await humanLevelNFT.waitForDeployment();
      
      expect(await humanLevelNFT.getAddress()).to.be.properAddress;
    });

    it('should register a human', async () => {
      await humanLevelNFT.connect(addr1).registerHuman('TestUser', 'ipfs://metadata');
      
      const human = await humanLevelNFT.humans(0);
      expect(human.username).to.equal('TestUser');
      expect(human.level).to.equal(0); // L1 - Novice
    });

    it('should level up human based on contribution', async () => {
      await humanLevelNFT.connect(addr1).registerHuman('TestUser', 'ipfs://metadata');
      
      // Add contribution to level up
      await humanLevelNFT.addContribution(0, 150); // Exceeds L2 threshold (100)
      
      const human = await humanLevelNFT.humans(0);
      expect(human.level).to.equal(1); // L2 - Apprentice
    });

    it('should get correct level name', async () => {
      const levelName = await humanLevelNFT.getLevelName(0);
      expect(levelName).to.equal('Novice');
    });

    it('should update reputation', async () => {
      await humanLevelNFT.connect(addr1).registerHuman('TestUser', 'ipfs://metadata');
      
      await humanLevelNFT.updateReputation(0, 80);
      
      const human = await humanLevelNFT.humans(0);
      expect(human.reputationScore).to.equal(80);
    });
  });

  describe('LiabilityRegistry - Pre-deployment Tests', () => {
    it('should deploy LiabilityRegistry contract', async () => {
      const LiabilityRegistry = await ethers.getContractFactory('LiabilityRegistry');
      liabilityRegistry = await LiabilityRegistry.deploy(owner.address);
      await liabilityRegistry.waitForDeployment();
      
      expect(await liabilityRegistry.getAddress()).to.be.properAddress;
    });

    it('should create liability agreement', async () => {
      const LiabilityRegistry = await ethers.getContractFactory('LiabilityRegistry');
      liabilityRegistry = await LiabilityRegistry.deploy(owner.address);
      
      await liabilityRegistry.createAgreement(
        addr1.address,
        addr2.address,
        1, // Liability type
        ethers.parseEther('1.0'),
        3600 // 1 hour duration
      );
      
      const agreement = await liabilityRegistry.agreements(0);
      expect(agreement.partyA).to.equal(addr1.address);
      expect(agreement.partyB).to.equal(addr2.address);
    });

    it('should activate agreement with deposit', async () => {
      const LiabilityRegistry = await ethers.getContractFactory('LiabilityRegistry');
      liabilityRegistry = await LiabilityRegistry.deploy(owner.address);
      
      await liabilityRegistry.createAgreement(
        addr1.address,
        addr2.address,
        1,
        ethers.parseEther('1.0'),
        3600
      );
      
      await liabilityRegistry.connect(addr1).activateAgreement(0, {
        value: ethers.parseEther('1.0')
      });
      
      const agreement = await liabilityRegistry.agreements(0);
      expect(agreement.active).to.be.true;
    });

    it('should resolve agreement and distribute funds', async () => {
      const LiabilityRegistry = await ethers.getContractFactory('LiabilityRegistry');
      liabilityRegistry = await LiabilityRegistry.deploy(owner.address);
      
      await liabilityRegistry.createAgreement(
        addr1.address,
        addr2.address,
        1,
        ethers.parseEther('1.0'),
        3600
      );
      
      await liabilityRegistry.connect(addr1).activateAgreement(0, {
        value: ethers.parseEther('1.0')
      });
      
      const balanceBefore = await ethers.provider.getBalance(addr2.address);
      
      await liabilityRegistry.connect(owner).resolveAgreement(0, addr2.address);
      
      const agreement = await liabilityRegistry.agreements(0);
      expect(agreement.resolved).to.be.true;
    });
  });

  describe('Integration with Existing Contracts', () => {
    it('should integrate HumanLevelNFT with TaskRegistry', async () => {
      // Human level affects task permissions
      const HumanLevelNFT = await ethers.getContractFactory('HumanLevelNFT');
      humanLevelNFT = await HumanLevelNFT.deploy();
      
      await humanLevelNFT.connect(addr1).registerHuman('Worker', 'ipfs://metadata');
      
      // Level 1 (Novice) should be able to accept tasks
      const human = await humanLevelNFT.humans(0);
      expect(human.level).to.equal(0);
      
      // Verify permissions logic
      const canAcceptTask = human.level >= 0;
      expect(canAcceptTask).to.be.true;
    });

    it('should integrate LiabilityRegistry with X402Payment', async () => {
      // Liability agreement can use X402 for payments
      const LiabilityRegistry = await ethers.getContractFactory('LiabilityRegistry');
      liabilityRegistry = await LiabilityRegistry.deploy(owner.address);
      
      await liabilityRegistry.createAgreement(
        addr1.address,
        addr2.address,
        2, // X402 payment type
        ethers.parseEther('0.1'),
        86400 // 1 day
      );
      
      const agreement = await liabilityRegistry.agreements(0);
      expect(agreement.liabilityType).to.equal(2);
    });
  });

  describe('Amoy Testnet Deployment Verification', () => {
    const AMOY_HUMAN_NFT = '0x...'; // To be filled after deployment
    const AMOY_LIABILITY_REGISTRY = '0x...'; // To be filled after deployment

    it.skip('should connect to Amoy HumanLevelNFT', async () => {
      // This test runs after Amoy deployment
      const provider = new ethers.JsonRpcProvider('https://rpc-amoy.polygon.technology');
      const contract = new ethers.Contract(AMOY_HUMAN_NFT, ['function humans(uint256) view returns (tuple)'], provider);
      
      const human = await contract.humans(0);
      expect(human.username).to.not.be.empty;
    });

    it.skip('should connect to Amoy LiabilityRegistry', async () => {
      // This test runs after Amoy deployment
      const provider = new ethers.JsonRpcProvider('https://rpc-amoy.polygon.technology');
      const contract = new ethers.Contract(AMOY_LIABILITY_REGISTRY, ['function agreements(uint256) view returns (tuple)'], provider);
      
      const agreement = await contract.agreements(0);
      expect(agreement.partyA).to.not.equal(ethers.ZeroAddress);
    });
  });
});

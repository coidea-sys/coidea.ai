const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('HumanLevelNFT - Human User Level Contract', function () {
  let HumanLevelNFT;
  let humanLevelNFT;
  let owner;
  let human1;
  let human2;
  let addr1;

  beforeEach(async function () {
    [owner, human1, human2, addr1] = await ethers.getSigners();
    
    HumanLevelNFT = await ethers.getContractFactory('HumanLevelNFT');
    humanLevelNFT = await HumanLevelNFT.deploy();
    await humanLevelNFT.waitForDeployment();
  });

  describe('Deployment', function () {
    it('Should set the right name and symbol', async function () {
      expect(await humanLevelNFT.name()).to.equal('Coidea Human');
      expect(await humanLevelNFT.symbol()).to.equal('COHM');
    });

    it('Should set the right owner', async function () {
      expect(await humanLevelNFT.owner()).to.equal(owner.address);
    });

    it('Should initialize level thresholds correctly', async function () {
      expect(await humanLevelNFT.levelThresholds(0)).to.equal(0);    // L1
      expect(await humanLevelNFT.levelThresholds(1)).to.equal(100);  // L2
      expect(await humanLevelNFT.levelThresholds(2)).to.equal(500);  // L3
      expect(await humanLevelNFT.levelThresholds(3)).to.equal(2000); // L4
      expect(await humanLevelNFT.levelThresholds(4)).to.equal(10000); // L5
    });

    it('Should initialize level names correctly', async function () {
      expect(await humanLevelNFT.levelNames(0)).to.equal('Novice');
      expect(await humanLevelNFT.levelNames(1)).to.equal('Apprentice');
      expect(await humanLevelNFT.levelNames(2)).to.equal('Expert');
      expect(await humanLevelNFT.levelNames(3)).to.equal('Master');
      expect(await humanLevelNFT.levelNames(4)).to.equal('Legend');
    });
  });

  describe('Human Registration', function () {
    it('Should register a new human with correct initial state', async function () {
      const tx = await humanLevelNFT.connect(human1).registerHuman(
        'Alice',
        'ipfs://alice-metadata'
      );
      
      await expect(tx)
        .to.emit(humanLevelNFT, 'HumanRegistered')
        .withArgs(0, human1.address, 'Alice');
      
      const human = await humanLevelNFT.humans(0);
      expect(human.username).to.equal('Alice');
      expect(human.level).to.equal(0); // L1 - Novice
      expect(human.contributionPoints).to.equal(0);
      expect(human.reputationScore).to.equal(50);
      expect(human.wallet).to.equal(human1.address);
    });

    it('Should assign token to human wallet', async function () {
      await humanLevelNFT.connect(human1).registerHuman('Alice', 'uri');
      expect(await humanLevelNFT.ownerOf(0)).to.equal(human1.address);
    });

    it('Should map wallet to token ID', async function () {
      await humanLevelNFT.connect(human1).registerHuman('Alice', 'uri');
      expect(await humanLevelNFT.walletToTokenId(human1.address)).to.equal(0);
    });

    it('Should not allow empty username', async function () {
      await expect(
        humanLevelNFT.connect(human1).registerHuman('', 'uri')
      ).to.be.revertedWith('Username cannot be empty');
    });

    it('Should not allow username too long', async function () {
      const longName = 'A'.repeat(33);
      await expect(
        humanLevelNFT.connect(human1).registerHuman(longName, 'uri')
      ).to.be.revertedWith('Username too long');
    });

    it('Should not allow duplicate registration', async function () {
      await humanLevelNFT.connect(human1).registerHuman('Alice', 'uri');
      await expect(
        humanLevelNFT.connect(human1).registerHuman('Alice2', 'uri')
      ).to.be.revertedWith('Wallet already registered');
    });

    it('Should allow multiple different humans to register', async function () {
      await humanLevelNFT.connect(human1).registerHuman('Alice', 'uri1');
      await humanLevelNFT.connect(human2).registerHuman('Bob', 'uri2');
      
      expect(await humanLevelNFT.walletToTokenId(human1.address)).to.equal(0);
      expect(await humanLevelNFT.walletToTokenId(human2.address)).to.equal(1);
    });
  });

  describe('Contribution System', function () {
    beforeEach(async function () {
      await humanLevelNFT.connect(human1).registerHuman('Alice', 'uri');
    });

    it('Should add contribution points', async function () {
      await expect(humanLevelNFT.connect(owner).addContribution(0, 50))
        .to.emit(humanLevelNFT, 'ContributionAdded')
        .withArgs(0, 50, 50);
      
      const human = await humanLevelNFT.humans(0);
      expect(human.contributionPoints).to.equal(50);
    });

    it('Should accumulate contribution points', async function () {
      await humanLevelNFT.connect(owner).addContribution(0, 30);
      await humanLevelNFT.connect(owner).addContribution(0, 20);
      
      const human = await humanLevelNFT.humans(0);
      expect(human.contributionPoints).to.equal(50);
    });

    it('Should only allow owner to add contribution', async function () {
      await expect(
        humanLevelNFT.connect(human1).addContribution(0, 50)
      ).to.be.revertedWithCustomError(humanLevelNFT, 'OwnableUnauthorizedAccount');
    });

    it('Should not add zero or negative points', async function () {
      await expect(
        humanLevelNFT.connect(owner).addContribution(0, 0)
      ).to.be.revertedWith('Points must be positive');
    });

    it('Should not add contribution to non-existent human', async function () {
      await expect(
        humanLevelNFT.connect(owner).addContribution(999, 50)
      ).to.be.revertedWith('Human does not exist');
    });

    it('Should batch add contributions', async function () {
      await humanLevelNFT.connect(human2).registerHuman('Bob', 'uri');
      
      await humanLevelNFT.connect(owner).batchAddContribution(
        [0, 1],
        [50, 100]
      );
      
      const human0 = await humanLevelNFT.humans(0);
      const human1 = await humanLevelNFT.humans(1);
      
      expect(human0.contributionPoints).to.equal(50);
      expect(human1.contributionPoints).to.equal(100);
    });

    it('Should reject batch with mismatched lengths', async function () {
      await expect(
        humanLevelNFT.connect(owner).batchAddContribution([0], [50, 100])
      ).to.be.revertedWith('Length mismatch');
    });
  });

  describe('Level Up System', function () {
    beforeEach(async function () {
      await humanLevelNFT.connect(human1).registerHuman('Alice', 'uri');
    });

    it('Should level up to L2 when reaching threshold', async function () {
      await expect(humanLevelNFT.connect(owner).addContribution(0, 100))
        .to.emit(humanLevelNFT, 'LevelUp')
        .withArgs(0, 0, 1); // L1 -> L2
      
      const human = await humanLevelNFT.humans(0);
      expect(human.level).to.equal(1); // L2
      expect(human.contributionPoints).to.equal(100);
    });

    it('Should level up to L3 when reaching threshold', async function () {
      await humanLevelNFT.connect(owner).addContribution(0, 500);
      
      const human = await humanLevelNFT.humans(0);
      expect(human.level).to.equal(2); // L3
    });

    it('Should level up to L4 when reaching threshold', async function () {
      await humanLevelNFT.connect(owner).addContribution(0, 2000);
      
      const human = await humanLevelNFT.humans(0);
      expect(human.level).to.equal(3); // L4
    });

    it('Should level up to L5 when reaching threshold', async function () {
      await humanLevelNFT.connect(owner).addContribution(0, 10000);
      
      const human = await humanLevelNFT.humans(0);
      expect(human.level).to.equal(4); // L5
    });

    it('Should skip levels if contribution is high enough', async function () {
      // Add 3000 points at once - should jump to L4
      await humanLevelNFT.connect(owner).addContribution(0, 3000);
      
      const human = await humanLevelNFT.humans(0);
      expect(human.level).to.equal(3); // L4
    });

    it('Should allow owner to force level up', async function () {
      await expect(humanLevelNFT.connect(owner).forceLevelUp(0, 3))
        .to.emit(humanLevelNFT, 'LevelUp')
        .withArgs(0, 0, 3); // L1 -> L4
      
      const human = await humanLevelNFT.humans(0);
      expect(human.level).to.equal(3); // L4
    });

    it('Should not allow force level down', async function () {
      await humanLevelNFT.connect(owner).addContribution(0, 500); // L3
      
      await expect(
        humanLevelNFT.connect(owner).forceLevelUp(0, 1)
      ).to.be.revertedWith('Can only level up');
    });

    it('Should not allow invalid level', async function () {
      // Enum values above 4 will cause runtime revert in Solidity
      // We test with a level that's valid enum but above L5 (which doesn't exist)
      // Actually, Solidity enums are checked at runtime in 0.8.x
      // So value 5 should revert automatically
      await expect(
        humanLevelNFT.connect(owner).forceLevelUp(0, 5)
      ).to.be.reverted;
    });
  });

  describe('Reputation System', function () {
    beforeEach(async function () {
      await humanLevelNFT.connect(human1).registerHuman('Alice', 'uri');
    });

    it('Should update reputation score', async function () {
      await expect(humanLevelNFT.connect(owner).updateReputation(0, 80))
        .to.emit(humanLevelNFT, 'ReputationUpdated')
        .withArgs(0, 50, 80);
      
      const human = await humanLevelNFT.humans(0);
      expect(human.reputationScore).to.equal(80);
    });

    it('Should not allow reputation above 100', async function () {
      await expect(
        humanLevelNFT.connect(owner).updateReputation(0, 101)
      ).to.be.revertedWith('Score must be 0-100');
    });

    it('Should only allow owner to update reputation', async function () {
      await expect(
        humanLevelNFT.connect(human1).updateReputation(0, 80)
      ).to.be.revertedWithCustomError(humanLevelNFT, 'OwnableUnauthorizedAccount');
    });
  });

  describe('Task Tracking', function () {
    beforeEach(async function () {
      await humanLevelNFT.connect(human1).registerHuman('Alice', 'uri');
    });

    it('Should record task published', async function () {
      await humanLevelNFT.connect(owner).recordTaskPublished(0);
      
      const human = await humanLevelNFT.humans(0);
      expect(human.tasksPublished).to.equal(1);
    });

    it('Should record task completed', async function () {
      await humanLevelNFT.connect(owner).recordTaskCompleted(0);
      
      const human = await humanLevelNFT.humans(0);
      expect(human.tasksCompleted).to.equal(1);
    });

    it('Should accumulate task counts', async function () {
      await humanLevelNFT.connect(owner).recordTaskPublished(0);
      await humanLevelNFT.connect(owner).recordTaskPublished(0);
      await humanLevelNFT.connect(owner).recordTaskCompleted(0);
      
      const human = await humanLevelNFT.humans(0);
      expect(human.tasksPublished).to.equal(2);
      expect(human.tasksCompleted).to.equal(1);
    });
  });

  describe('Permission Checks', function () {
    beforeEach(async function () {
      await humanLevelNFT.connect(human1).registerHuman('Alice', 'uri');
      await humanLevelNFT.connect(human2).registerHuman('Bob', 'uri');
    });

    it('Should allow all levels to publish tasks', async function () {
      expect(await humanLevelNFT.canPublishTask(0)).to.be.true;
      expect(await humanLevelNFT.canPublishTask(1)).to.be.true;
    });

    it('Should only allow L4+ to arbitrate', async function () {
      // L1 cannot arbitrate
      expect(await humanLevelNFT.canArbitrate(0)).to.be.false;
      
      // Upgrade human1 to L4
      await humanLevelNFT.connect(owner).forceLevelUp(0, 3);
      expect(await humanLevelNFT.canArbitrate(0)).to.be.true;
    });

    it('Should only allow L5 to govern', async function () {
      // L4 cannot govern
      await humanLevelNFT.connect(owner).forceLevelUp(0, 3);
      expect(await humanLevelNFT.canGovern(0)).to.be.false;
      
      // L5 can govern
      await humanLevelNFT.connect(owner).forceLevelUp(0, 4);
      expect(await humanLevelNFT.canGovern(0)).to.be.true;
    });
  });

  describe('Query Functions', function () {
    beforeEach(async function () {
      await humanLevelNFT.connect(human1).registerHuman('Alice', 'uri');
      await humanLevelNFT.connect(human2).registerHuman('Bob', 'uri');
    });

    it('Should get level correctly', async function () {
      expect(await humanLevelNFT.getLevel(0)).to.equal(0);
      
      await humanLevelNFT.connect(owner).addContribution(0, 100);
      expect(await humanLevelNFT.getLevel(0)).to.equal(1);
    });

    it('Should get level name correctly', async function () {
      expect(await humanLevelNFT.getLevelName(0)).to.equal('Novice');
      
      await humanLevelNFT.connect(owner).addContribution(0, 100);
      expect(await humanLevelNFT.getLevelName(0)).to.equal('Apprentice');
    });

    it('Should get human by wallet', async function () {
      const human = await humanLevelNFT.getHumanByWallet(human1.address);
      expect(human.username).to.equal('Alice');
    });

    it('Should check if wallet is registered', async function () {
      expect(await humanLevelNFT.isRegistered(human1.address)).to.be.true;
      expect(await humanLevelNFT.isRegistered(addr1.address)).to.be.false;
    });

    it('Should get humans by level', async function () {
      // Both start at L1
      let l1Humans = await humanLevelNFT.getHumansByLevel(0);
      expect(l1Humans.length).to.equal(2);
      
      // Upgrade human1 to L2
      await humanLevelNFT.connect(owner).addContribution(0, 100);
      
      l1Humans = await humanLevelNFT.getHumansByLevel(0);
      expect(l1Humans.length).to.equal(1);
      
      const l2Humans = await humanLevelNFT.getHumansByLevel(1);
      expect(l2Humans.length).to.equal(1);
      expect(l2Humans[0]).to.equal(0);
    });
  });

  describe('Metadata Management', function () {
    beforeEach(async function () {
      await humanLevelNFT.connect(human1).registerHuman('Alice', 'ipfs://initial');
    });

    it('Should return correct token URI', async function () {
      expect(await humanLevelNFT.tokenURI(0)).to.equal('ipfs://initial');
    });

    it('Should allow human to update metadata URI', async function () {
      await humanLevelNFT.connect(human1).setTokenURI(0, 'ipfs://updated');
      expect(await humanLevelNFT.tokenURI(0)).to.equal('ipfs://updated');
    });

    it('Should not allow non-owner to update metadata', async function () {
      await expect(
        humanLevelNFT.connect(addr1).setTokenURI(0, 'ipfs://hacked')
      ).to.be.revertedWith('Not authorized');
    });
  });

  describe('Admin Functions', function () {
    it('Should allow owner to update level threshold', async function () {
      await humanLevelNFT.connect(owner).setLevelThreshold(2, 600);
      expect(await humanLevelNFT.levelThresholds(2)).to.equal(600);
    });

    it('Should not allow changing L1 threshold', async function () {
      await expect(
        humanLevelNFT.connect(owner).setLevelThreshold(0, 100)
      ).to.be.revertedWith('Cannot change L1 threshold');
    });

    it('Should only allow owner to update threshold', async function () {
      await expect(
        humanLevelNFT.connect(human1).setLevelThreshold(2, 600)
      ).to.be.revertedWithCustomError(humanLevelNFT, 'OwnableUnauthorizedAccount');
    });
  });

  describe('Edge Cases', function () {
    it('Should handle max uint256 contribution', async function () {
      await humanLevelNFT.connect(human1).registerHuman('Alice', 'uri');
      
      // Should level up to L5 immediately
      await humanLevelNFT.connect(owner).addContribution(0, ethers.MaxUint256);
      
      const human = await humanLevelNFT.humans(0);
      expect(human.level).to.equal(4); // L5
    });

    it('Should not allow operations on non-existent tokens', async function () {
      await expect(
        humanLevelNFT.getLevel(999)
      ).to.be.revertedWith('Human does not exist');
    });
  });
});

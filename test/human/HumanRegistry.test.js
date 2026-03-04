const { expect } = require('chai');
const { ethers, time } = require('hardhat');

describe('HumanRegistry - Sprint 1', () => {
  let humanRegistry;
  let owner;
  let user1;
  let user2;
  
  const REGISTRATION_FEE = ethers.parseEther('0.001');

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    
    const HumanRegistry = await ethers.getContractFactory('HumanRegistry');
    humanRegistry = await HumanRegistry.deploy(owner.address);
    await humanRegistry.waitForDeployment();
  });

  describe('Registration', () => {
    it('should allow new user to register with fee', async () => {
      await expect(
        humanRegistry.connect(user1).register('alice', 'ipfs://Qm...', {
          value: REGISTRATION_FEE
        })
      ).to.not.be.reverted;
      
      const human = await humanRegistry.humans(user1.address);
      expect(human.username).to.equal('alice');
      expect(human.metadataURI).to.equal('ipfs://Qm...');
      expect(human.isActive).to.be.true;
    });

    it('should reject registration without fee', async () => {
      await expect(
        humanRegistry.connect(user1).register('alice', 'ipfs://Qm...')
      ).to.be.revertedWith('Insufficient fee');
    });

    it('should reject duplicate registration', async () => {
      await humanRegistry.connect(user1).register('alice', 'ipfs://Qm...', {
        value: REGISTRATION_FEE
      });
      
      await expect(
        humanRegistry.connect(user1).register('alice2', 'ipfs://Qm2...', {
          value: REGISTRATION_FEE
        })
      ).to.be.revertedWith('Already registered');
    });

    it('should emit HumanRegistered event', async () => {
      const tx = await humanRegistry.connect(user1).register('alice', 'ipfs://Qm...', {
        value: REGISTRATION_FEE
      });
      
      await expect(tx)
        .to.emit(humanRegistry, 'HumanRegistered')
        .withArgs(user1.address, 'alice', await ethers.provider.getBlock('latest').then(b => b.timestamp));
    });

    it('should reject empty username', async () => {
      await expect(
        humanRegistry.connect(user1).register('', 'ipfs://Qm...', {
          value: REGISTRATION_FEE
        })
      ).to.be.reverted;
    });
  });

  describe('Profile Query', () => {
    beforeEach(async () => {
      await humanRegistry.connect(user1).register('alice', 'ipfs://Qm...', {
        value: REGISTRATION_FEE
      });
    });

    it('should return human data', async () => {
      const human = await humanRegistry.humans(user1.address);
      
      expect(human.wallet).to.equal(user1.address);
      expect(human.username).to.equal('alice');
      expect(human.metadataURI).to.equal('ipfs://Qm...');
      expect(human.reputation).to.equal(100);
      expect(human.isActive).to.be.true;
    });

    it('should return empty for non-existent human', async () => {
      const human = await humanRegistry.humans(user2.address);
      
      expect(human.wallet).to.equal(ethers.ZeroAddress);
      expect(human.isActive).to.be.false;
    });

    it('should check if address is human', async () => {
      expect(await humanRegistry.isHuman(user1.address)).to.be.true;
      expect(await humanRegistry.isHuman(user2.address)).to.be.false;
    });
  });

  describe('Pause Functionality', () => {
    it('should allow owner to pause', async () => {
      await humanRegistry.pause();
      expect(await humanRegistry.paused()).to.be.true;
    });

    it('should block registration when paused', async () => {
      await humanRegistry.pause();
      
      await expect(
        humanRegistry.connect(user1).register('alice', 'ipfs://Qm...', {
          value: REGISTRATION_FEE
        })
      ).to.be.revertedWith('Pausable: paused');
    });

    it('should allow registration after unpause', async () => {
      await humanRegistry.pause();
      await humanRegistry.unpause();
      
      await expect(
        humanRegistry.connect(user1).register('alice', 'ipfs://Qm...', {
          value: REGISTRATION_FEE
        })
      ).to.not.be.reverted;
    });
  });

  describe('Update Profile', () => {
    beforeEach(async () => {
      await humanRegistry.connect(user1).register('alice', 'ipfs://Qm...', {
        value: REGISTRATION_FEE
      });
    });

    it('should allow human to update metadata', async () => {
      await humanRegistry.connect(user1).updateProfile('ipfs://QmNew...');
      
      const human = await humanRegistry.humans(user1.address);
      expect(human.metadataURI).to.equal('ipfs://QmNew...');
    });

    it('should emit HumanUpdated event', async () => {
      await expect(
        humanRegistry.connect(user1).updateProfile('ipfs://QmNew...')
      )
        .to.emit(humanRegistry, 'HumanUpdated')
        .withArgs(user1.address, 'metadataURI', 'ipfs://QmNew...');
    });
  });
});

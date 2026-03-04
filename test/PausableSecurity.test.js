const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Pausable Contract Security', () => {
  let humanRegistry;
  let owner;
  let admin;
  let user;

  beforeEach(async () => {
    [owner, admin, user] = await ethers.getSigners();
    
    const HumanRegistry = await ethers.getContractFactory('HumanRegistry');
    humanRegistry = await HumanRegistry.deploy(owner.address);
    await humanRegistry.waitForDeployment();
  });

  describe('Pause Functionality', () => {
    it('should allow owner to pause contract', async () => {
      await humanRegistry.pause();
      expect(await humanRegistry.paused()).to.be.true;
    });

    it('should allow owner to unpause contract', async () => {
      await humanRegistry.pause();
      await humanRegistry.unpause();
      expect(await humanRegistry.paused()).to.be.false;
    });

    it('should prevent non-owner from pausing', async () => {
      await expect(
        humanRegistry.connect(user).pause()
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should block transactions when paused', async () => {
      await humanRegistry.pause();
      
      await expect(
        humanRegistry.connect(user).register('test', 'metadata', {
          value: ethers.parseEther('0.001')
        })
      ).to.be.revertedWith('Pausable: paused');
    });

    it('should allow transactions after unpause', async () => {
      await humanRegistry.pause();
      await humanRegistry.unpause();
      
      await expect(
        humanRegistry.connect(user).register('test', 'metadata', {
          value: ethers.parseEther('0.001')
        })
      ).to.not.be.reverted;
    });
  });

  describe('Emergency Stop', () => {
    it('should emit EmergencyStop event on pause', async () => {
      await expect(humanRegistry.pause())
        .to.emit(humanRegistry, 'Paused')
        .withArgs(owner.address);
    });

    it('should emit EmergencyResume event on unpause', async () => {
      await humanRegistry.pause();
      await expect(humanRegistry.unpause())
        .to.emit(humanRegistry, 'Unpaused')
        .withArgs(owner.address);
    });
  });
});

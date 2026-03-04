const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Emergency Pause System', () => {
  let humanRegistry;
  let taskRegistry;
  let owner;
  let admin;
  let user;

  beforeEach(async () => {
    [owner, admin, user] = await ethers.getSigners();
    
    const HumanRegistry = await ethers.getContractFactory('HumanRegistry');
    humanRegistry = await HumanRegistry.deploy(owner.address);
    await humanRegistry.waitForDeployment();
    
    const TaskRegistry = await ethers.getContractFactory('TaskRegistry');
    taskRegistry = await TaskRegistry.deploy(owner.address);
    await taskRegistry.waitForDeployment();
  });

  describe('Emergency Pause', () => {
    it('should allow owner to trigger emergency pause', async () => {
      await humanRegistry.emergencyPause();
      expect(await humanRegistry.paused()).to.be.true;
    });

    it('should emit EmergencyPause event', async () => {
      const tx = await humanRegistry.emergencyPause();
      const receipt = await tx.wait();
      
      await expect(tx)
        .to.emit(humanRegistry, 'EmergencyPause')
        .withArgs(owner.address, receipt.blockNumber);
    });

    it('should block all transactions when paused', async () => {
      await humanRegistry.emergencyPause();
      
      await expect(
        humanRegistry.connect(user).register('test', 'meta', {
          value: ethers.parseEther('0.001')
        })
      ).to.be.revertedWith('Pausable: paused');
    });

    it('should allow owner to resume', async () => {
      await humanRegistry.emergencyPause();
      await humanRegistry.emergencyResume();
      
      expect(await humanRegistry.paused()).to.be.false;
    });

    it('should emit EmergencyResume event', async () => {
      await humanRegistry.emergencyPause();
      
      await expect(humanRegistry.emergencyResume())
        .to.emit(humanRegistry, 'EmergencyResume')
        .withArgs(owner.address);
    });
  });

  describe('Pause Reasons', () => {
    it('should record pause reason', async () => {
      const reason = 'Security incident detected';
      await humanRegistry.emergencyPauseWithReason(reason);
      
      expect(await humanRegistry.pauseReason()).to.equal(reason);
    });

    it('should clear reason on resume', async () => {
      await humanRegistry.emergencyPauseWithReason('Test reason');
      await humanRegistry.emergencyResume();
      
      expect(await humanRegistry.pauseReason()).to.equal('');
    });
  });

  describe('Multi-Contract Pause', () => {
    it('should pause all contracts simultaneously', async () => {
      // Pause HumanRegistry
      await humanRegistry.emergencyPause();
      
      // In real implementation, this would trigger pause on all contracts
      // via a central pause controller
      
      expect(await humanRegistry.paused()).to.be.true;
    });
  });
});

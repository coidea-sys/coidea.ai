const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('HumanEconomy - Sprint 1', () => {
  let humanEconomy;
  let humanRegistry;
  let owner;
  let user1;
  let user2;
  let treasury;
  
  const REGISTRATION_FEE = ethers.parseEther('0.001');

  beforeEach(async () => {
    [owner, user1, user2, treasury] = await ethers.getSigners();
    
    // Deploy HumanRegistry
    const HumanRegistry = await ethers.getContractFactory('HumanRegistry');
    humanRegistry = await HumanRegistry.deploy(treasury.address);
    await humanRegistry.waitForDeployment();
    
    // Deploy HumanEconomy
    const HumanEconomy = await ethers.getContractFactory('HumanEconomy');
    humanEconomy = await HumanEconomy.deploy(
      await humanRegistry.getAddress(),
      treasury.address, // dummy agentLifecycle
      treasury.address
    );
    await humanEconomy.waitForDeployment();
    
    // Register user1 as human
    await humanRegistry.connect(user1).register('alice', 'ipfs://Qm...', {
      value: REGISTRATION_FEE
    });
  });

  describe('Deposit', () => {
    it('should accept ETH deposit', async () => {
      const depositAmount = ethers.parseEther('1.0');
      
      await expect(
        humanEconomy.connect(user1).deposit({ value: depositAmount })
      ).to.not.be.reverted;
    });

    it('should update wallet balance', async () => {
      const depositAmount = ethers.parseEther('1.0');
      
      await humanEconomy.connect(user1).deposit({ value: depositAmount });
      
      const wallet = await humanEconomy.humanWallets(user1.address);
      expect(wallet.availableBalance).to.equal(depositAmount);
    });

    it('should emit Deposited event', async () => {
      const depositAmount = ethers.parseEther('1.0');
      
      await expect(humanEconomy.connect(user1).deposit({ value: depositAmount }))
        .to.emit(humanEconomy, 'Deposited')
        .withArgs(user1.address, depositAmount, depositAmount);
    });

    it('should reject deposit from non-human', async () => {
      const depositAmount = ethers.parseEther('1.0');
      
      await expect(
        humanEconomy.connect(user2).deposit({ value: depositAmount })
      ).to.be.revertedWith('Not human');
    });

    it('should accumulate multiple deposits', async () => {
      await humanEconomy.connect(user1).deposit({ value: ethers.parseEther('1.0') });
      await humanEconomy.connect(user1).deposit({ value: ethers.parseEther('2.0') });
      
      const wallet = await humanEconomy.humanWallets(user1.address);
      expect(wallet.availableBalance).to.equal(ethers.parseEther('3.0'));
    });
  });

  describe('Withdraw', () => {
    beforeEach(async () => {
      await humanEconomy.connect(user1).deposit({ value: ethers.parseEther('5.0') });
    });

    it('should allow withdrawal', async () => {
      const withdrawAmount = ethers.parseEther('1.0');
      const balanceBefore = await ethers.provider.getBalance(user1.address);
      
      await humanEconomy.connect(user1).withdraw(withdrawAmount);
      
      const wallet = await humanEconomy.humanWallets(user1.address);
      expect(wallet.availableBalance).to.equal(ethers.parseEther('4.0'));
    });

    it('should emit Withdrawn event', async () => {
      const withdrawAmount = ethers.parseEther('1.0');
      
      await expect(humanEconomy.connect(user1).withdraw(withdrawAmount))
        .to.emit(humanEconomy, 'Withdrawn')
        .withArgs(user1.address, withdrawAmount, ethers.parseEther('4.0'));
    });

    it('should reject withdrawal exceeding balance', async () => {
      await expect(
        humanEconomy.connect(user1).withdraw(ethers.parseEther('10.0'))
      ).to.be.revertedWith('Insufficient balance');
    });

    it('should reject withdrawal from non-human', async () => {
      await expect(
        humanEconomy.connect(user2).withdraw(ethers.parseEther('1.0'))
      ).to.be.revertedWith('Not human');
    });
  });

  describe('Balance Query', () => {
    it('should return zero for new user', async () => {
      // user2 is not registered
      const wallet = await humanEconomy.humanWallets(user2.address);
      expect(wallet.availableBalance).to.equal(0);
    });

    it('should track total deposited', async () => {
      await humanEconomy.connect(user1).deposit({ value: ethers.parseEther('3.0') });
      
      const wallet = await humanEconomy.humanWallets(user1.address);
      expect(wallet.totalDeposited).to.equal(ethers.parseEther('3.0'));
    });

    it('should track total withdrawn', async () => {
      await humanEconomy.connect(user1).deposit({ value: ethers.parseEther('5.0') });
      await humanEconomy.connect(user1).withdraw(ethers.parseEther('2.0'));
      
      const wallet = await humanEconomy.humanWallets(user1.address);
      expect(wallet.totalWithdrawn).to.equal(ethers.parseEther('2.0'));
    });
  });
});

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Allowance Limit Security', () => {
  let humanEconomy;
  let owner;
  let user;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    
    const HumanEconomy = await ethers.getContractFactory('HumanEconomy');
    // Use dummy addresses for dependencies
    humanEconomy = await HumanEconomy.deploy(
      owner.address, // dummy HumanRegistry
      owner.address, // dummy AgentLifecycle
      owner.address  // treasury
    );
    await humanEconomy.waitForDeployment();
  });

  describe('Investment Limits', () => {
    it('should track daily investment limit', async () => {
      const limit = await humanEconomy.DAILY_INVESTMENT_LIMIT();
      expect(limit).to.equal(ethers.parseEther('10'));
    });

    it('should track daily withdrawal limit', async () => {
      const limit = await humanEconomy.DAILY_WITHDRAWAL_LIMIT();
      expect(limit).to.equal(ethers.parseEther('10'));
    });

    it('should have withdrawal cooldown', async () => {
      const cooldown = await humanEconomy.WITHDRAWAL_COOLDOWN();
      expect(cooldown).to.equal(3600); // 1 hour
    });
  });

  describe('Limit Tracking', () => {
    it('should initialize daily tracking to zero', async () => {
      const invested = await humanEconomy.dailyInvested(user.address);
      const withdrawn = await humanEconomy.dailyWithdrawn(user.address);
      
      expect(invested).to.equal(0);
      expect(withdrawn).to.equal(0);
    });

    it('should track last investment day', async () => {
      const lastDay = await humanEconomy.lastInvestmentDay(user.address);
      expect(lastDay).to.equal(0);
    });

    it('should track last withdrawal day', async () => {
      const lastDay = await humanEconomy.lastWithdrawalDay(user.address);
      expect(lastDay).to.equal(0);
    });
  });
});

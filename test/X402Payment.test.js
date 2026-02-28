const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('X402Payment - Micropayment Contract', function () {
  let X402Payment;
  let x402Payment;
  let owner;
  let payer;
  let payee;
  let feeRecipient;
  let addr1;

  beforeEach(async function () {
    [owner, payer, payee, feeRecipient, addr1] = await ethers.getSigners();
    
    X402Payment = await ethers.getContractFactory('X402Payment');
    x402Payment = await X402Payment.deploy(feeRecipient.address);
    await x402Payment.waitForDeployment();
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await x402Payment.owner()).to.equal(owner.address);
    });

    it('Should set the fee recipient', async function () {
      expect(await x402Payment.feeRecipient()).to.equal(feeRecipient.address);
    });

    it('Should initialize with default platform fee', async function () {
      expect(await x402Payment.platformFee()).to.equal(100); // 1%
    });

    it('Should have ETH as supported token', async function () {
      expect(await x402Payment.supportedTokens(ethers.ZeroAddress)).to.be.true;
    });
  });

  describe('ETH Authorization', function () {
    it('Should create ETH authorization', async function () {
      const amount = ethers.parseEther('1.0');
      const duration = 7 * 24 * 60 * 60; // 7 days
      const payloadHash = ethers.keccak256(ethers.toUtf8Bytes('test payload'));
      
      const tx = await x402Payment.connect(payer).authorizeETH(
        payee.address,
        amount,
        duration,
        payloadHash,
        { value: amount }
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return x402Payment.interface.parseLog(log).name === 'Authorized';
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const authId = x402Payment.interface.parseLog(event).args[0];
      const auth = await x402Payment.authorizations(authId);
      
      expect(auth.payer).to.equal(payer.address);
      expect(auth.payee).to.equal(payee.address);
      expect(auth.amount).to.equal(amount);
      expect(auth.token).to.equal(ethers.ZeroAddress);
    });

    it('Should refund excess ETH', async function () {
      const amount = ethers.parseEther('1.0');
      const sent = ethers.parseEther('1.5');
      const duration = 7 * 24 * 60 * 60;
      const payloadHash = ethers.keccak256(ethers.toUtf8Bytes('test'));
      
      const balanceBefore = await ethers.provider.getBalance(payer.address);
      
      await x402Payment.connect(payer).authorizeETH(
        payee.address,
        amount,
        duration,
        payloadHash,
        { value: sent }
      );
      
      const balanceAfter = await ethers.provider.getBalance(payer.address);
      
      // Should have received refund (minus gas)
      expect(balanceAfter).to.be.gt(balanceBefore - sent - ethers.parseEther('0.01'));
    });

    it('Should not authorize with insufficient ETH', async function () {
      await expect(
        x402Payment.connect(payer).authorizeETH(
          payee.address,
          ethers.parseEther('1.0'),
          7 * 24 * 60 * 60,
          ethers.keccak256(ethers.toUtf8Bytes('test')),
          { value: ethers.parseEther('0.5') }
        )
      ).to.be.revertedWith('Insufficient ETH sent');
    });

    it('Should not authorize below minimum amount', async function () {
      await expect(
        x402Payment.connect(payer).authorizeETH(
          payee.address,
          ethers.parseEther('0.0001'),
          7 * 24 * 60 * 60,
          ethers.keccak256(ethers.toUtf8Bytes('test')),
          { value: ethers.parseEther('0.0001') }
        )
      ).to.be.revertedWith('Amount below minimum');
    });

    it('Should not authorize to self', async function () {
      await expect(
        x402Payment.connect(payer).authorizeETH(
          payer.address,
          ethers.parseEther('1.0'),
          7 * 24 * 60 * 60,
          ethers.keccak256(ethers.toUtf8Bytes('test')),
          { value: ethers.parseEther('1.0') }
        )
      ).to.be.revertedWith('Cannot pay yourself');
    });

    it('Should track payer authorizations', async function () {
      await x402Payment.connect(payer).authorizeETH(
        payee.address,
        ethers.parseEther('1.0'),
        7 * 24 * 60 * 60,
        ethers.keccak256(ethers.toUtf8Bytes('test1')),
        { value: ethers.parseEther('1.0') }
      );
      
      await x402Payment.connect(payer).authorizeETH(
        addr1.address,
        ethers.parseEther('2.0'),
        7 * 24 * 60 * 60,
        ethers.keccak256(ethers.toUtf8Bytes('test2')),
        { value: ethers.parseEther('2.0') }
      );
      
      const auths = await x402Payment.getPayerAuthorizations(payer.address);
      expect(auths.length).to.equal(2);
    });
  });

  describe('ETH Settlement', function () {
    let authId;
    let payload;
    let payloadHash;
    const amount = ethers.parseEther('1.0');

    beforeEach(async function () {
      payload = ethers.toUtf8Bytes('test payload');
      payloadHash = ethers.keccak256(payload);
      
      const tx = await x402Payment.connect(payer).authorizeETH(
        payee.address,
        amount,
        7 * 24 * 60 * 60,
        payloadHash,
        { value: amount }
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return x402Payment.interface.parseLog(log).name === 'Authorized';
        } catch {
          return false;
        }
      });
      
      authId = x402Payment.interface.parseLog(event).args[0];
    });

    it('Should settle full amount', async function () {
      const payeeBalanceBefore = await ethers.provider.getBalance(payee.address);
      
      await x402Payment.connect(payee).settle(authId, amount, payload);
      
      const payeeBalanceAfter = await ethers.provider.getBalance(payee.address);
      const auth = await x402Payment.authorizations(authId);
      
      expect(auth.state).to.equal(1); // Settled
      expect(auth.settledAmount).to.equal(amount);
      expect(payeeBalanceAfter).to.be.gt(payeeBalanceBefore);
    });

    it('Should deduct platform fee', async function () {
      const feeRecipientBalanceBefore = await ethers.provider.getBalance(feeRecipient.address);
      
      await x402Payment.connect(payee).settle(authId, amount, payload);
      
      const feeRecipientBalanceAfter = await ethers.provider.getBalance(feeRecipient.address);
      expect(feeRecipientBalanceAfter).to.be.gt(feeRecipientBalanceBefore);
    });

    it('Should allow partial settlement', async function () {
      const partialAmount = ethers.parseEther('0.5');
      
      await x402Payment.connect(payee).settle(authId, partialAmount, payload);
      
      const auth = await x402Payment.authorizations(authId);
      expect(auth.state).to.equal(0); // Still Pending
      expect(auth.settledAmount).to.equal(partialAmount);
    });

    it('Should not allow non-payee to settle', async function () {
      await expect(
        x402Payment.connect(addr1).settle(authId, amount, payload)
      ).to.be.revertedWith('Not authorized payee');
    });

    it('Should not settle with invalid payload', async function () {
      const wrongPayload = ethers.toUtf8Bytes('wrong payload');
      await expect(
        x402Payment.connect(payee).settle(authId, amount, wrongPayload)
      ).to.be.revertedWith('Invalid payload');
    });

    it('Should not settle more than authorized', async function () {
      const tooMuch = ethers.parseEther('2.0');
      await expect(
        x402Payment.connect(payee).settle(authId, tooMuch, payload)
      ).to.be.revertedWith('Amount exceeds remaining');
    });
  });

  describe('Cancellation', function () {
    let authId;
    let payload;
    let payloadHash;
    const amount = ethers.parseEther('1.0');

    beforeEach(async function () {
      payload = ethers.toUtf8Bytes('test payload');
      payloadHash = ethers.keccak256(payload);
      
      const tx = await x402Payment.connect(payer).authorizeETH(
        payee.address,
        amount,
        7 * 24 * 60 * 60,
        payloadHash,
        { value: amount }
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return x402Payment.interface.parseLog(log).name === 'Authorized';
        } catch {
          return false;
        }
      });
      
      authId = x402Payment.interface.parseLog(event).args[0];
    });

    it('Should allow payer to cancel', async function () {
      const payerBalanceBefore = await ethers.provider.getBalance(payer.address);
      
      await x402Payment.connect(payer).cancel(authId);
      
      const auth = await x402Payment.authorizations(authId);
      expect(auth.state).to.equal(2); // Cancelled
      
      const payerBalanceAfter = await ethers.provider.getBalance(payer.address);
      expect(payerBalanceAfter).to.be.gt(payerBalanceBefore);
    });

    it('Should not allow non-payer to cancel', async function () {
      await expect(
        x402Payment.connect(payee).cancel(authId)
      ).to.be.revertedWith('Not authorized payer');
    });

    it('Should not cancel already settled authorization', async function () {
      await x402Payment.connect(payee).settle(authId, amount, payload);
      
      await expect(
        x402Payment.connect(payer).cancel(authId)
      ).to.be.revertedWith('Authorization not pending');
    });
  });

  describe('Refund Expired', function () {
    let authId;
    const amount = ethers.parseEther('1.0');

    beforeEach(async function () {
      const payloadHash = ethers.keccak256(ethers.toUtf8Bytes('test'));
      
      const tx = await x402Payment.connect(payer).authorizeETH(
        payee.address,
        amount,
        1, // 1 second duration
        payloadHash,
        { value: amount }
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return x402Payment.interface.parseLog(log).name === 'Authorized';
        } catch {
          return false;
        }
      });
      
      authId = x402Payment.interface.parseLog(event).args[0];
    });

    it('Should allow refund of expired authorization', async function () {
      // Wait for expiration
      await ethers.provider.send('evm_increaseTime', [2]);
      await ethers.provider.send('evm_mine');
      
      const payerBalanceBefore = await ethers.provider.getBalance(payer.address);
      
      await x402Payment.connect(addr1).refundExpired(authId);
      
      const auth = await x402Payment.authorizations(authId);
      expect(auth.state).to.equal(3); // Refunded
      
      const payerBalanceAfter = await ethers.provider.getBalance(payer.address);
      expect(payerBalanceAfter).to.be.gt(payerBalanceBefore);
    });

    it('Should not refund non-expired authorization', async function () {
      // Create new auth with longer duration
      const payloadHash = ethers.keccak256(ethers.toUtf8Bytes('test2'));
      const tx = await x402Payment.connect(payer).authorizeETH(
        payee.address,
        amount,
        10000, // Long duration
        payloadHash,
        { value: amount }
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return x402Payment.interface.parseLog(log).name === 'Authorized';
        } catch {
          return false;
        }
      });
      
      const newAuthId = x402Payment.interface.parseLog(event).args[0];
      
      await expect(
        x402Payment.connect(addr1).refundExpired(newAuthId)
      ).to.be.revertedWith('Authorization not expired');
    });
  });

  describe('Admin Functions', function () {
    it('Should allow owner to update platform fee', async function () {
      await expect(x402Payment.connect(owner).setPlatformFee(200))
        .to.emit(x402Payment, 'PlatformFeeUpdated')
        .withArgs(200);
      
      expect(await x402Payment.platformFee()).to.equal(200); // 2%
    });

    it('Should not allow fee above 5%', async function () {
      await expect(
        x402Payment.connect(owner).setPlatformFee(501)
      ).to.be.revertedWith('Fee cannot exceed 5%');
    });

    it('Should only allow owner to update fee', async function () {
      await expect(
        x402Payment.connect(payer).setPlatformFee(200)
      ).to.be.revertedWithCustomError(x402Payment, 'OwnableUnauthorizedAccount');
    });

    it('Should allow owner to update fee recipient', async function () {
      await x402Payment.connect(owner).setFeeRecipient(addr1.address);
      expect(await x402Payment.feeRecipient()).to.equal(addr1.address);
    });

    it('Should allow owner to add supported token', async function () {
      const mockToken = addr1.address; // Using address as mock token
      
      await expect(x402Payment.connect(owner).setTokenSupport(mockToken, true))
        .to.emit(x402Payment, 'TokenSupportUpdated')
        .withArgs(mockToken, true);
      
      expect(await x402Payment.supportedTokens(mockToken)).to.be.true;
    });

    it('Should not allow changing ETH support', async function () {
      await expect(
        x402Payment.connect(owner).setTokenSupport(ethers.ZeroAddress, false)
      ).to.be.revertedWith('Cannot change ETH support');
    });
  });

  describe('Query Functions', function () {
    let authId;
    const amount = ethers.parseEther('1.0');

    beforeEach(async function () {
      const payloadHash = ethers.keccak256(ethers.toUtf8Bytes('test'));
      
      const tx = await x402Payment.connect(payer).authorizeETH(
        payee.address,
        amount,
        7 * 24 * 60 * 60,
        payloadHash,
        { value: amount }
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return x402Payment.interface.parseLog(log).name === 'Authorized';
        } catch {
          return false;
        }
      });
      
      authId = x402Payment.interface.parseLog(event).args[0];
    });

    it('Should get remaining amount', async function () {
      const remaining = await x402Payment.getRemainingAmount(authId);
      expect(remaining).to.equal(amount);
    });

    it('Should check if settleable', async function () {
      expect(await x402Payment.isSettleable(authId)).to.be.true;
      
      // After settlement
      const payload = ethers.toUtf8Bytes('test');
      await x402Payment.connect(payee).settle(authId, amount, payload);
      
      expect(await x402Payment.isSettleable(authId)).to.be.false;
    });

    it('Should get authorization details', async function () {
      const auth = await x402Payment.getAuthorization(authId);
      expect(auth.payer).to.equal(payer.address);
      expect(auth.payee).to.equal(payee.address);
      expect(auth.amount).to.equal(amount);
    });
  });

  describe('Emergency Withdraw', function () {
    it('Should allow owner to emergency withdraw ETH', async function () {
      // Send ETH to contract
      await payer.sendTransaction({
        to: x402Payment.target,
        value: ethers.parseEther('1.0')
      });
      
      const contractBalance = await ethers.provider.getBalance(x402Payment.target);
      expect(contractBalance).to.equal(ethers.parseEther('1.0'));
      
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      await x402Payment.connect(owner).emergencyWithdraw(ethers.ZeroAddress);
      
      const contractBalanceAfter = await ethers.provider.getBalance(x402Payment.target);
      expect(contractBalanceAfter).to.equal(0);
    });

    it('Should only allow owner to emergency withdraw', async function () {
      await expect(
        x402Payment.connect(payer).emergencyWithdraw(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(x402Payment, 'OwnableUnauthorizedAccount');
    });
  });
});

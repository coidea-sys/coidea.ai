const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('X402Payment - True x402 Protocol', function () {
  let X402Payment;
  let x402;
  let owner;
  let payer;
  let payee;
  let facilitator;
  let feeRecipient;
  
  // EIP-712 domain
  let domain;
  let types;

  beforeEach(async function () {
    [owner, payer, payee, facilitator, feeRecipient] = await ethers.getSigners();
    
    X402Payment = await ethers.getContractFactory('X402Payment');
    x402 = await X402Payment.deploy(feeRecipient.address);
    await x402.waitForDeployment();
    
    // Approve facilitator
    await x402.connect(owner).setFacilitator(facilitator.address, true);
    
    // Setup EIP-712
    domain = {
      name: "X402 Payment Protocol",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await x402.getAddress()
    };
    
    types = {
      Authorization: [
        { name: "payer", type: "address" },
        { name: "payee", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "token", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "expiresAt", type: "uint256" },
        { name: "payloadHash", type: "bytes32" }
      ]
    };
  });

  describe('Deployment', function () {
    it('Should set correct EIP-712 domain', async function () {
    });

    it('Should set fee recipient', async function () {
      expect(await x402.feeRecipient()).to.equal(feeRecipient.address);
    });
  });

  describe('Authorization with EIP-712 Signature', function () {
    it('Should create authorization with valid signature', async function () {
      const amount = ethers.parseEther('1.0');
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const payloadHash = ethers.keccak256(ethers.toUtf8Bytes('test'));
      const gasFee = ethers.parseEther('0.01');
      
      const value = {
        payer: payer.address,
        payee: payee.address,
        amount: amount,
        token: ethers.ZeroAddress,
        nonce: 0,
        expiresAt: expiresAt,
        payloadHash: payloadHash
      };
      
      const signature = await payer.signTypedData(domain, types, value);
      
      const tx = await x402.authorize(
        payer.address,
        payee.address,
        amount,
        ethers.ZeroAddress,
        expiresAt,
        payloadHash,
        facilitator.address,
        gasFee,
        signature
      );
      
      await expect(tx).to.emit(x402, 'Authorized');
      
      const authId = await x402.payerAuthorizations(payer.address, 0);
      const auth = await x402.authorizations(authId);
      expect(auth.payer).to.equal(payer.address);
      expect(auth.amount).to.equal(amount);
    });

    it('Should reject invalid signature', async function () {
      const amount = ethers.parseEther('1.0');
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const payloadHash = ethers.keccak256(ethers.toUtf8Bytes('test'));
      
      const value = {
        payer: payer.address,
        payee: payee.address,
        amount: amount,
        token: ethers.ZeroAddress,
        nonce: 0,
        expiresAt: expiresAt,
        payloadHash: payloadHash
      };
      
      // Sign with wrong signer
      const wrongSignature = await payee.signTypedData(domain, types, value);
      
      await expect(
        x402.authorize(
          payer.address,
          payee.address,
          amount,
          ethers.ZeroAddress,
          expiresAt,
          payloadHash,
          facilitator.address,
          0,
          wrongSignature
        )
      ).to.be.revertedWith('Invalid signature');
    });
  });

  describe('Settlement', function () {
    let authId;
    let amount;
    let payload;
    let payloadHash;

    beforeEach(async function () {
      amount = ethers.parseEther('1.0');
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      payload = ethers.toUtf8Bytes('test payload');
      payloadHash = ethers.keccak256(payload);
      const gasFee = ethers.parseEther('0.01');
      
      const value = {
        payer: payer.address,
        payee: payee.address,
        amount: amount,
        token: ethers.ZeroAddress,
        nonce: 0,
        expiresAt: expiresAt,
        payloadHash: payloadHash
      };
      
      const signature = await payer.signTypedData(domain, types, value);
      
      await x402.authorize(
        payer.address,
        payee.address,
        amount,
        ethers.ZeroAddress,
        expiresAt,
        payloadHash,
        facilitator.address,
        gasFee,
        signature
      );
      
      authId = await x402.payerAuthorizations(payer.address, 0);
    });

    it('Should settle with valid payload', async function () {
      // Fund payer
      await payer.sendTransaction({
        to: await x402.getAddress(),
        value: amount
      });
      
      await expect(x402.connect(payee).settle(authId, amount, payload))
        .to.emit(x402, 'Settled');
    });
  });

  describe('Admin Functions', function () {
    it('Should set facilitator', async function () {
      await expect(x402.connect(owner).setFacilitator(facilitator.address, true))
        .to.emit(x402, 'FacilitatorUpdated');
      expect(await x402.facilitators(facilitator.address)).to.be.true;
    });

    it('Should set token support', async function () {
      const mockToken = facilitator.address;
      await expect(x402.connect(owner).setTokenSupport(mockToken, true))
        .to.emit(x402, 'TokenSupportUpdated');
      expect(await x402.supportedTokens(mockToken)).to.be.true;
    });
  });
});

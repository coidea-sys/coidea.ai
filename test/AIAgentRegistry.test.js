const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('AIAgentRegistry', function () {
  let AIAgentRegistry;
  let registry;
  let owner;
  let registrant;
  let agentWallet;
  let addr1;
  let feeRecipient;

  beforeEach(async function () {
    [owner, registrant, agentWallet, addr1, feeRecipient] = await ethers.getSigners();
    
    AIAgentRegistry = await ethers.getContractFactory('AIAgentRegistry');
    registry = await AIAgentRegistry.deploy(feeRecipient.address);
    await registry.waitForDeployment();
  });

  describe('Deployment', function () {
    it('Should set the right name and symbol', async function () {
      expect(await registry.name()).to.equal('AI Agent Registry');
      expect(await registry.symbol()).to.equal('AGENT');
    });

    it('Should set the fee recipient', async function () {
      expect(await registry.feeRecipient()).to.equal(feeRecipient.address);
    });
  });

  describe('Agent Registration', function () {
    it('Should register a new agent', async function () {
      const tx = await registry.connect(registrant).registerAgent(
        'TestAgent',
        'ipfs://metadata',
        agentWallet.address
      );
      
      await expect(tx).to.emit(registry, 'AgentRegistered');
      
      const agent = await registry.agents(0);
      expect(agent.agentName).to.equal('TestAgent');
      expect(agent.reputationScore).to.equal(5000);
    });
  });
});

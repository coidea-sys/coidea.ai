const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('AgentLifecycle - Sprint 2', () => {
  let agentLifecycle;
  let aiAgentRegistry;
  let humanRegistry;
  let humanEconomy;
  let owner;
  let human;
  let treasury;
  
  const REGISTRATION_FEE = ethers.parseEther('0.001');

  beforeEach(async () => {
    [owner, human, treasury] = await ethers.getSigners();
    
    // Deploy HumanRegistry
    const HumanRegistry = await ethers.getContractFactory('HumanRegistry');
    humanRegistry = await HumanRegistry.deploy(treasury.address);
    await humanRegistry.waitForDeployment();
    
    // Register human
    await humanRegistry.connect(human).register('human1', 'ipfs://meta', {
      value: REGISTRATION_FEE
    });
    
    // Deploy AIAgentRegistry
    const AIAgentRegistry = await ethers.getContractFactory('AIAgentRegistry');
    aiAgentRegistry = await AIAgentRegistry.deploy(owner.address);
    await aiAgentRegistry.waitForDeployment();
    
    // Deploy AgentLifecycle
    const AgentLifecycle = await ethers.getContractFactory('AgentLifecycle');
    agentLifecycle = await AgentLifecycle.deploy(
      await aiAgentRegistry.getAddress(),
      owner.address
    );
    await agentLifecycle.waitForDeployment();
  });

  describe('createAgent', () => {
    it('should allow human to create agent', async () => {
      await expect(
        agentLifecycle.connect(human).createAgent(
          'TestAgent',
          ['coding', 'writing'],
          'ipfs://config',
          { value: ethers.parseEther('0.01') }
        )
      ).to.not.be.reverted;
    });

    it('should emit AgentCreated event', async () => {
      await expect(
        agentLifecycle.connect(human).createAgent(
          'TestAgent',
          ['coding'],
          'ipfs://config',
          { value: ethers.parseEther('0.01') }
        )
      ).to.emit(agentLifecycle, 'AgentCreated');
    });

    it('should reject empty name', async () => {
      await expect(
        agentLifecycle.connect(human).createAgent(
          '',
          ['coding'],
          'ipfs://config',
          { value: ethers.parseEther('0.01') }
        )
      ).to.be.reverted;
    });

    it('should require minimum funding', async () => {
      await expect(
        agentLifecycle.connect(human).createAgent(
          'TestAgent',
          ['coding'],
          'ipfs://config',
          { value: ethers.parseEther('0.001') }
        )
      ).to.be.reverted;
    });
  });

  describe('fundAgent', () => {
    let agentId;

    beforeEach(async () => {
      const tx = await agentLifecycle.connect(human).createAgent(
        'TestAgent',
        ['coding'],
        'ipfs://config',
        { value: ethers.parseEther('0.01') }
      );
      const receipt = await tx.wait();
      
      // Get agent ID from event
      const event = receipt.logs.find(
        log => log.fragment?.name === 'AgentCreated'
      );
      agentId = event?.args?.agentId || 0;
    });

    it('should allow owner to fund agent', async () => {
      await expect(
        agentLifecycle.connect(human).fundAgent(agentId, {
          value: ethers.parseEther('0.05')
        })
      ).to.not.be.reverted;
    });

    it('should update agent balance', async () => {
      await agentLifecycle.connect(human).fundAgent(agentId, {
        value: ethers.parseEther('0.05')
      });
      
      const agent = await aiAgentRegistry.agents(agentId);
      expect(agent.balance).to.be.gt(0);
    });

    it('should emit AgentFunded event', async () => {
      await expect(
        agentLifecycle.connect(human).fundAgent(agentId, {
          value: ethers.parseEther('0.05')
        })
      ).to.emit(agentLifecycle, 'AgentFunded');
    });
  });

  describe('getAgent', () => {
    beforeEach(async () => {
      await agentLifecycle.connect(human).createAgent(
        'TestAgent',
        ['coding', 'writing'],
        'ipfs://config',
        { value: ethers.parseEther('0.01') }
      );
    });

    it('should return agent data', async () => {
      const agent = await aiAgentRegistry.agents(0);
      
      expect(agent.name).to.equal('TestAgent');
      expect(agent.owner).to.equal(human.address);
      expect(agent.isActive).to.be.true;
    });

    it('should return agent skills', async () => {
      const skills = await aiAgentRegistry.getAgentSkills(0);
      expect(skills).to.include('coding');
      expect(skills).to.include('writing');
    });
  });

  describe('Agent Query', () => {
    it('should return agent count', async () => {
      const count = await aiAgentRegistry.totalAgents();
      expect(count).to.equal(0);
      
      await agentLifecycle.connect(human).createAgent(
        'Agent1',
        ['coding'],
        'ipfs://config',
        { value: ethers.parseEther('0.01') }
      );
      
      expect(await aiAgentRegistry.totalAgents()).to.equal(1);
    });

    it('should return agents by owner', async () => {
      await agentLifecycle.connect(human).createAgent(
        'Agent1',
        ['coding'],
        'ipfs://config',
        { value: ethers.parseEther('0.01') }
      );
      
      const agentIds = await aiAgentRegistry.getAgentsByOwner(human.address);
      expect(agentIds.length).to.equal(1);
    });
  });
});

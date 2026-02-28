const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('ERC8004 - AI Agent Identity Contract', function () {
  let ERC8004;
  let erc8004;
  let owner;
  let developer;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, developer, addr1, addr2] = await ethers.getSigners();
    
    ERC8004 = await ethers.getContractFactory('ERC8004');
    erc8004 = await ERC8004.deploy();
    await erc8004.waitForDeployment();
  });

  describe('Deployment', function () {
    it('Should set the right name and symbol', async function () {
      expect(await erc8004.name()).to.equal('Coidea AI Agent');
      expect(await erc8004.symbol()).to.equal('COAI');
    });

    it('Should set the right owner', async function () {
      expect(await erc8004.owner()).to.equal(owner.address);
    });
  });

  describe('Agent Creation', function () {
    it('Should create a new agent with correct initial state', async function () {
      const tx = await erc8004.connect(developer).createAgent(
        'TestAgent',
        ['coding', 'analysis'],
        'ipfs://metadata-uri'
      );
      
      await expect(tx)
        .to.emit(erc8004, 'AgentCreated')
        .withArgs(0, developer.address, 'TestAgent');
      
      const agent = await erc8004.agents(0);
      expect(agent.name).to.equal('TestAgent');
      expect(agent.state).to.equal(1); // Active
      expect(agent.reputationScore).to.equal(50);
      expect(agent.developer).to.equal(developer.address);
    });

    it('Should assign token to developer', async function () {
      await erc8004.connect(developer).createAgent(
        'TestAgent',
        ['coding'],
        'ipfs://metadata-uri'
      );
      
      expect(await erc8004.ownerOf(0)).to.equal(developer.address);
    });

    it('Should track developer agents', async function () {
      await erc8004.connect(developer).createAgent('Agent1', ['coding'], 'uri1');
      await erc8004.connect(developer).createAgent('Agent2', ['analysis'], 'uri2');
      
      const agentIds = await erc8004.getDeveloperAgents(developer.address);
      expect(agentIds.length).to.equal(2);
      expect(agentIds[0]).to.equal(0);
      expect(agentIds[1]).to.equal(1);
    });
  });

  describe('Life Cycle State Management', function () {
    beforeEach(async function () {
      await erc8004.connect(developer).createAgent(
        'TestAgent',
        ['coding'],
        'ipfs://metadata-uri'
      );
    });

    it('Should allow developer to update state', async function () {
      await expect(erc8004.connect(developer).updateState(0, 2)) // Standby
        .to.emit(erc8004, 'StateChanged')
        .withArgs(0, 1, 2); // Active -> Standby
      
      const agent = await erc8004.agents(0);
      expect(agent.state).to.equal(2); // Standby
    });

    it('Should not allow non-owner to update state', async function () {
      await expect(
        erc8004.connect(addr1).updateState(0, 2)
      ).to.be.revertedWith('Not authorized');
    });

    it('Should support all life cycle states', async function () {
      const states = [0, 1, 2, 3, 4]; // Dormant, Active, Standby, Evolving, Retired
      
      for (const state of states) {
        await erc8004.connect(developer).updateState(0, state);
        const agent = await erc8004.agents(0);
        expect(agent.state).to.equal(state);
      }
    });
  });

  describe('Reputation System', function () {
    beforeEach(async function () {
      await erc8004.connect(developer).createAgent(
        'TestAgent',
        ['coding'],
        'ipfs://metadata-uri'
      );
    });

    it('Should update reputation after successful task', async function () {
      await expect(erc8004.connect(owner).recordTaskCompletion(0, true, 80))
        .to.emit(erc8004, 'TaskCompleted')
        .withArgs(0, true);
      
      const agent = await erc8004.agents(0);
      expect(agent.completedTasks).to.equal(1);
      expect(agent.successfulTasks).to.equal(1);
    });

    it('Should update reputation after failed task', async function () {
      await erc8004.connect(owner).recordTaskCompletion(0, false, 40);
      
      const agent = await erc8004.agents(0);
      expect(agent.completedTasks).to.equal(1);
      expect(agent.successfulTasks).to.equal(0);
    });

    it('Should calculate reputation correctly over multiple tasks', async function () {
      // 5 successful tasks with quality 90
      for (let i = 0; i < 5; i++) {
        await erc8004.connect(owner).recordTaskCompletion(0, true, 90);
      }
      
      const agent = await erc8004.agents(0);
      expect(agent.completedTasks).to.equal(5);
      expect(agent.successfulTasks).to.equal(5);
      // Reputation should be high (success rate 100%, quality 90)
      expect(agent.reputationScore).to.be.gt(70);
    });

    it('Should only allow owner to record task completion', async function () {
      await expect(
        erc8004.connect(developer).recordTaskCompletion(0, true, 80)
      ).to.be.revertedWithCustomError(erc8004, 'OwnableUnauthorizedAccount');
    });
  });

  describe('Advanced Agent Permissions', function () {
    it('Should identify advanced agents (reputation >= 80)', async function () {
      await erc8004.connect(developer).createAgent('AdvancedAgent', ['coding'], 'uri');
      
      // Complete 10 high-quality tasks
      for (let i = 0; i < 10; i++) {
        await erc8004.connect(owner).recordTaskCompletion(0, true, 95);
      }
      
      expect(await erc8004.isAdvanced(0)).to.be.true;
    });

    it('Should identify expert agents (reputation >= 95)', async function () {
      await erc8004.connect(developer).createAgent('ExpertAgent', ['coding'], 'uri');
      
      // Complete 20 perfect tasks
      for (let i = 0; i < 20; i++) {
        await erc8004.connect(owner).recordTaskCompletion(0, true, 100);
      }
      
      expect(await erc8004.isExpert(0)).to.be.true;
    });

    it('Should not identify new agents as advanced', async function () {
      await erc8004.connect(developer).createAgent('NewAgent', ['coding'], 'uri');
      expect(await erc8004.isAdvanced(0)).to.be.false;
    });
  });

  describe('Metadata Management', function () {
    beforeEach(async function () {
      await erc8004.connect(developer).createAgent(
        'TestAgent',
        ['coding'],
        'ipfs://initial-uri'
      );
    });

    it('Should return correct token URI', async function () {
      expect(await erc8004.tokenURI(0)).to.equal('ipfs://initial-uri');
    });

    it('Should allow developer to update metadata URI', async function () {
      await erc8004.connect(developer).setTokenURI(0, 'ipfs://updated-uri');
      expect(await erc8004.tokenURI(0)).to.equal('ipfs://updated-uri');
    });

    it('Should not allow non-owner to update metadata', async function () {
      await expect(
        erc8004.connect(addr1).setTokenURI(0, 'ipfs://hacked-uri')
      ).to.be.revertedWith('Not authorized');
    });
  });

  describe('Agent Information Retrieval', function () {
    beforeEach(async function () {
      await erc8004.connect(developer).createAgent(
        'TestAgent',
        ['coding', 'analysis', 'design'],
        'ipfs://metadata-uri'
      );
    });

    it('Should return complete agent info', async function () {
      const info = await erc8004.getAgentInfo(0);
      
      expect(info.name).to.equal('TestAgent');
      expect(info.capabilityTags).to.deep.equal(['coding', 'analysis', 'design']);
      expect(info.state).to.equal(1); // Active
      expect(info.reputationScore).to.equal(50);
      expect(info.developer).to.equal(developer.address);
    });
  });

  describe('Edge Cases', function () {
    it('Should handle empty capability tags', async function () {
      await erc8004.connect(developer).createAgent('MinimalAgent', [], 'uri');
      
      const agent = await erc8004.agents(0);
      expect(agent.name).to.equal('MinimalAgent');
    });

    it('Should handle long names', async function () {
      const longName = 'A'.repeat(100);
      await erc8004.connect(developer).createAgent(longName, ['coding'], 'uri');
      
      const agent = await erc8004.agents(0);
      expect(agent.name).to.equal(longName);
    });

    it('Should not allow operations on non-existent tokens', async function () {
      await expect(
        erc8004.getAgentInfo(999)
      ).to.be.revertedWith('Agent does not exist');
    });
  });
});

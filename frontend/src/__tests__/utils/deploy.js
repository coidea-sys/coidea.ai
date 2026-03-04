/**
 * Test utilities for contract deployment
 */

const { ethers } = require('hardhat');

async function deployContracts() {
  const [deployer] = await ethers.getSigners();

  // Deploy HumanRegistry
  const HumanRegistry = await ethers.getContractFactory('HumanRegistry');
  const humanRegistry = await HumanRegistry.deploy(deployer.address);
  await humanRegistry.waitForDeployment();

  // Deploy AIAgentRegistry
  const AIAgentRegistry = await ethers.getContractFactory('AIAgentRegistry');
  const aiAgentRegistry = await AIAgentRegistry.deploy(deployer.address);
  await aiAgentRegistry.waitForDeployment();

  // Deploy HumanLevelNFT
  const HumanLevelNFT = await ethers.getContractFactory('HumanLevelNFT');
  const humanLevelNFT = await HumanLevelNFT.deploy();
  await humanLevelNFT.waitForDeployment();

  // Deploy AgentLifecycle
  const AgentLifecycle = await ethers.getContractFactory('AgentLifecycle');
  const agentLifecycle = await AgentLifecycle.deploy(
    await aiAgentRegistry.getAddress(),
    deployer.address
  );
  await agentLifecycle.waitForDeployment();

  // Deploy HumanEconomy
  const HumanEconomy = await ethers.getContractFactory('HumanEconomy');
  const humanEconomy = await HumanEconomy.deploy(
    await humanRegistry.getAddress(),
    await agentLifecycle.getAddress(),
    deployer.address
  );
  await humanEconomy.waitForDeployment();

  // Deploy TaskRegistry
  const TaskRegistry = await ethers.getContractFactory('TaskRegistry');
  const taskRegistry = await TaskRegistry.deploy(deployer.address);
  await taskRegistry.waitForDeployment();

  return {
    humanRegistry,
    aiAgentRegistry,
    humanLevelNFT,
    agentLifecycle,
    humanEconomy,
    taskRegistry,
  };
}

module.exports = { deployContracts };

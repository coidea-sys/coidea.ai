const { ethers, network } = require("hardhat");
const fs = require('fs');
const path = require('path');

// 网络配置
const NETWORK_CONFIG = {
  hardhat: {
    name: 'Local Hardhat',
    confirmations: 1,
    verify: false
  },
  localhost: {
    name: 'Local Node',
    confirmations: 1,
    verify: false
  },
  polygonAmoy: {
    name: 'Polygon Amoy Testnet',
    confirmations: 2,
    verify: true,
    explorer: 'https://amoy.polygonscan.com'
  }
};

async function main() {
  const config = NETWORK_CONFIG[network.name];
  if (!config) {
    throw new Error(`Unknown network: ${network.name}`);
  }

  console.log(`\n🚀 Deploying all contracts to: ${config.name}`);
  console.log(`   Chain ID: ${network.config.chainId}\n`);

  // 获取签名者
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // 检查余额
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ${network.name === 'polygon' ? 'POL' : 'ETH/POL'}\n`);

  if (balance === 0n && network.name !== 'hardhat') {
    console.error(`❌ Insufficient balance!`);
    process.exit(1);
  }

  const deployments = {};
  const deployerAddress = deployer.address;

  // ============ Phase 1: 基础合约（无依赖） ============
  console.log('📦 Phase 1: Base Contracts (No Dependencies)\n');

  // 1. HumanRegistry
  console.log('📄 1/12 Deploying HumanRegistry...');
  const HumanRegistry = await ethers.getContractFactory("contracts/HumanRegistry.sol:HumanRegistry");
  const humanRegistry = await HumanRegistry.deploy(deployerAddress);
  await humanRegistry.deploymentTransaction().wait(config.confirmations);
  deployments.HumanRegistry = await humanRegistry.getAddress();
  console.log(`   ✅ ${deployments.HumanRegistry}`);

  // 2. AIAgentRegistry
  console.log('📄 2/12 Deploying AIAgentRegistry...');
  const AIAgentRegistry = await ethers.getContractFactory("contracts/AIAgentRegistry.sol:AIAgentRegistry");
  const aiAgentRegistry = await AIAgentRegistry.deploy(deployerAddress);
  await aiAgentRegistry.deploymentTransaction().wait(config.confirmations);
  deployments.AIAgentRegistry = await aiAgentRegistry.getAddress();
  console.log(`   ✅ ${deployments.AIAgentRegistry}`);

  // 3. HumanLevelNFT
  console.log('📄 3/12 Deploying HumanLevelNFT...');
  const HumanLevelNFT = await ethers.getContractFactory("contracts/HumanLevelNFT.sol:HumanLevelNFT");
  const humanLevelNFT = await HumanLevelNFT.deploy();
  await humanLevelNFT.deploymentTransaction().wait(config.confirmations);
  deployments.HumanLevelNFT = await humanLevelNFT.getAddress();
  console.log(`   ✅ ${deployments.HumanLevelNFT}`);

  // 4. CommunityGovernance
  console.log('📄 4/12 Deploying CommunityGovernance...');
  const CommunityGovernance = await ethers.getContractFactory("contracts/CommunityGovernance.sol:CommunityGovernance");
  const communityGovernance = await CommunityGovernance.deploy(deployerAddress);
  await communityGovernance.deploymentTransaction().wait(config.confirmations);
  deployments.CommunityGovernance = await communityGovernance.getAddress();
  console.log(`   ✅ ${deployments.CommunityGovernance}`);

  // 5. LiabilityRegistry
  console.log('📄 5/12 Deploying LiabilityRegistry...');
  const LiabilityRegistry = await ethers.getContractFactory("contracts/LiabilityRegistry.sol:LiabilityRegistry");
  const liabilityRegistry = await LiabilityRegistry.deploy(deployerAddress);
  await liabilityRegistry.deploymentTransaction().wait(config.confirmations);
  deployments.LiabilityRegistry = await liabilityRegistry.getAddress();
  console.log(`   ✅ ${deployments.LiabilityRegistry}`);

  // ============ Phase 2: 一级依赖合约 ============
  console.log('\n📦 Phase 2: Contracts with Level 1 Dependencies\n');

  // 6. AgentCommunity (依赖 AIAgentRegistry, CommunityGovernance)
  console.log('📄 6/12 Deploying AgentCommunity...');
  const AgentCommunity = await ethers.getContractFactory("contracts/AgentCommunity.sol:AgentCommunity");
  const agentCommunity = await AgentCommunity.deploy(
    deployments.AIAgentRegistry,
    deployments.CommunityGovernance
  );
  await agentCommunity.deploymentTransaction().wait(config.confirmations);
  deployments.AgentCommunity = await agentCommunity.getAddress();
  console.log(`   ✅ ${deployments.AgentCommunity}`);

  // 7. LiabilityPreset (无依赖)
  console.log('📄 7/12 Deploying LiabilityPreset...');
  const LiabilityPreset = await ethers.getContractFactory("contracts/LiabilityPreset.sol:LiabilityPreset");
  const liabilityPreset = await LiabilityPreset.deploy();
  await liabilityPreset.deploymentTransaction().wait(config.confirmations);
  deployments.LiabilityPreset = await liabilityPreset.getAddress();
  console.log(`   ✅ ${deployments.LiabilityPreset}`);

  // 8. AgentLifecycle (依赖 AIAgentRegistry, treasury)
  console.log('📄 8/12 Deploying AgentLifecycle...');
  const AgentLifecycle = await ethers.getContractFactory("contracts/AgentLifecycle.sol:AgentLifecycle");
  const agentLifecycle = await AgentLifecycle.deploy(
    deployments.AIAgentRegistry,
    deployerAddress
  );
  await agentLifecycle.deploymentTransaction().wait(config.confirmations);
  deployments.AgentLifecycle = await agentLifecycle.getAddress();
  console.log(`   ✅ ${deployments.AgentLifecycle}`);

  // ============ Phase 3: 二级依赖合约 ============
  console.log('\n📦 Phase 3: Contracts with Level 2 Dependencies\n');

  // 9. AgentRuntime (无构造函数参数，依赖通过 setter 设置)
  console.log('📄 9/12 Deploying AgentRuntime...');
  const AgentRuntime = await ethers.getContractFactory("contracts/AgentRuntime.sol:AgentRuntime");
  const agentRuntime = await AgentRuntime.deploy();
  await agentRuntime.deploymentTransaction().wait(config.confirmations);
  deployments.AgentRuntime = await agentRuntime.getAddress();
  console.log(`   ✅ ${deployments.AgentRuntime}`);

  // 10. HumanEconomy (依赖 HumanRegistry, AgentLifecycle, treasury)
  console.log('📄 10/12 Deploying HumanEconomy...');
  const HumanEconomy = await ethers.getContractFactory("contracts/HumanEconomy.sol:HumanEconomy");
  const humanEconomy = await HumanEconomy.deploy(
    deployments.HumanRegistry,
    deployments.AgentLifecycle,
    deployerAddress
  );
  await humanEconomy.deploymentTransaction().wait(config.confirmations);
  deployments.HumanEconomy = await humanEconomy.getAddress();
  console.log(`   ✅ ${deployments.HumanEconomy}`);

  // ============ Phase 4: 三级依赖合约 ============
  console.log('\n📦 Phase 4: Contracts with Level 3 Dependencies\n');

  // 11. TaskRegistry (依赖 feeRecipient)
  console.log('📄 11/12 Deploying TaskRegistry...');
  const TaskRegistry = await ethers.getContractFactory("contracts/TaskRegistry.sol:TaskRegistry");
  const taskRegistry = await TaskRegistry.deploy(deployerAddress);
  await taskRegistry.deploymentTransaction().wait(config.confirmations);
  deployments.TaskRegistry = await taskRegistry.getAddress();
  console.log(`   ✅ ${deployments.TaskRegistry}`);

  // 12. X402Payment (依赖 TaskRegistry)
  console.log('📄 12/12 Deploying X402Payment...');
  const X402Payment = await ethers.getContractFactory("contracts/X402Payment.sol:X402Payment");
  const x402Payment = await X402Payment.deploy(deployerAddress);
  await x402Payment.deploymentTransaction().wait(config.confirmations);
  deployments.X402Payment = await x402Payment.getAddress();
  console.log(`   ✅ ${deployments.X402Payment}`);

  // ============ 保存部署信息 ============
  console.log('\n💾 Saving deployment info...\n');

  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployerAddress,
    contracts: deployments,
    timestamp: new Date().toISOString(),
    explorer: config.explorer
  };

  // 保存到 deployments/ 目录
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`   ✅ Saved: deployments/${network.name}.json`);

  // 同时保存最新部署
  const latestFile = path.join(deploymentsDir, 'latest.json');
  fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`   ✅ Saved: deployments/latest.json`);

  // ============ 打印摘要 ============
  console.log('\n' + '='.repeat(60));
  console.log('📋 DEPLOYMENT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Network:     ${config.name}`);
  console.log(`Chain ID:    ${network.config.chainId}`);
  console.log(`Deployer:    ${deployerAddress}`);
  console.log(`Timestamp:   ${deploymentInfo.timestamp}`);
  console.log('-'.repeat(60));
  
  for (const [name, address] of Object.entries(deployments)) {
    console.log(`${name.padEnd(20)} ${address}`);
    if (config.explorer) {
      console.log(`${''.padEnd(20)} ${config.explorer}/address/${address}`);
    }
  }
  console.log('='.repeat(60));

  // ============ 自动验证 ============
  if (config.verify && network.name === 'polygonAmoy') {
    console.log('\n🔍 Starting contract verification...\n');

    const contractsToVerify = [
      { name: 'HumanRegistry', address: deployments.HumanRegistry, args: [deployerAddress] },
      { name: 'AIAgentRegistry', address: deployments.AIAgentRegistry, args: [deployerAddress] },
      { name: 'HumanLevelNFT', address: deployments.HumanLevelNFT, args: [] },
      { name: 'CommunityGovernance', address: deployments.CommunityGovernance, args: [deployerAddress] },
      { name: 'LiabilityRegistry', address: deployments.LiabilityRegistry, args: [deployerAddress] },
      { name: 'AgentCommunity', address: deployments.AgentCommunity, args: [deployments.AIAgentRegistry, deployments.CommunityGovernance] },
      { name: 'LiabilityPreset', address: deployments.LiabilityPreset, args: [] },
      { name: 'AgentLifecycle', address: deployments.AgentLifecycle, args: [deployments.AIAgentRegistry, deployerAddress] },
      { name: 'AgentRuntime', address: deployments.AgentRuntime, args: [] },
      { name: 'HumanEconomy', address: deployments.HumanEconomy, args: [deployments.HumanRegistry, deployments.AgentLifecycle, deployerAddress] },
      { name: 'TaskRegistry', address: deployments.TaskRegistry, args: [deployerAddress] },
      { name: 'X402Payment', address: deployments.X402Payment, args: [deployerAddress] },
    ];

    for (const contract of contractsToVerify) {
      console.log(`📋 Verifying ${contract.name}...`);
      try {
        await hre.run("verify:verify", {
          address: contract.address,
          constructorArguments: contract.args,
        });
        console.log(`   ✅ ${contract.name} verified`);
      } catch (error) {
        if (error.message.includes("Already Verified")) {
          console.log(`   ⚠️  ${contract.name} already verified`);
        } else {
          console.error(`   ❌ ${contract.name} failed:`, error.message.split('\n')[0]);
        }
      }
    }
  }

  // ============ 更新 .env 提示 ============
  console.log('\n📝 Update your .env file with:\n');
  const envPrefix = network.name === 'localhost' ? 'LOCALHOST' : 
                    network.name === 'polygonAmoy' ? 'AMOY' : 'POLYGON';
  
  for (const [name, address] of Object.entries(deployments)) {
    const envName = name
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .replace(/^_/, '');
    console.log(`${envPrefix}_${envName}_ADDRESS=${address}`);
  }

  console.log('\n✨ All contracts deployed!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  });

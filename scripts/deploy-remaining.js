const { ethers, network } = require("hardhat");
const fs = require('fs');
const path = require('path');

// 网络配置
const NETWORK_CONFIG = {
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
    throw new Error(`Unsupported network: ${network.name}`);
  }

  console.log(`\n🚀 Deploying remaining contracts to: ${config.name}`);
  console.log(`   Chain ID: ${network.config.chainId}\n`);

  // 获取签名者
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // 检查余额
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} POL\n`);

  if (balance === 0n) {
    console.error(`❌ Insufficient balance! Get testnet POL from faucet`);
    process.exit(1);
  }

  // 读取已部署合约地址
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  const existingDeployment = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, 'polygonAmoy.json'), 'utf8')
  );
  
  const existingAddresses = existingDeployment.contracts;
  console.log('📋 Existing deployments:');
  for (const [name, addr] of Object.entries(existingAddresses)) {
    console.log(`   ${name}: ${addr}`);
  }
  console.log('');

  const deployments = {};

  // 1. HumanRegistry (无依赖)
  console.log('📄 1/8 Deploying HumanRegistry...');
  const HumanRegistry = await ethers.getContractFactory("contracts/HumanRegistry.sol:HumanRegistry");
  const humanRegistry = await HumanRegistry.deploy();
  await humanRegistry.deploymentTransaction().wait(config.confirmations);
  deployments.HumanRegistry = await humanRegistry.getAddress();
  console.log(`   ✅ ${deployments.HumanRegistry}\n`);

  // 2. AgentCommunity (无依赖，但可选依赖 CommunityGovernance)
  console.log('📄 2/8 Deploying AgentCommunity...');
  const AgentCommunity = await ethers.getContractFactory("contracts/AgentCommunity.sol:AgentCommunity");
  const agentCommunity = await AgentCommunity.deploy();
  await agentCommunity.deploymentTransaction().wait(config.confirmations);
  deployments.AgentCommunity = await agentCommunity.getAddress();
  console.log(`   ✅ ${deployments.AgentCommunity}\n`);

  // 3. CommunityGovernance (无依赖)
  console.log('📄 3/8 Deploying CommunityGovernance...');
  const CommunityGovernance = await ethers.getContractFactory("contracts/CommunityGovernance.sol:CommunityGovernance");
  const communityGovernance = await CommunityGovernance.deploy();
  await communityGovernance.deploymentTransaction().wait(config.confirmations);
  deployments.CommunityGovernance = await communityGovernance.getAddress();
  console.log(`   ✅ ${deployments.CommunityGovernance}\n`);

  // 4. LiabilityRegistry (无依赖)
  console.log('📄 4/8 Deploying LiabilityRegistry...');
  const LiabilityRegistry = await ethers.getContractFactory("contracts/LiabilityRegistry.sol:LiabilityRegistry");
  const liabilityRegistry = await LiabilityRegistry.deploy();
  await liabilityRegistry.deploymentTransaction().wait(config.confirmations);
  deployments.LiabilityRegistry = await liabilityRegistry.getAddress();
  console.log(`   ✅ ${deployments.LiabilityRegistry}\n`);

  // 5. LiabilityPreset (依赖 LiabilityRegistry)
  console.log('📄 5/8 Deploying LiabilityPreset...');
  const LiabilityPreset = await ethers.getContractFactory("contracts/LiabilityPreset.sol:LiabilityPreset");
  const liabilityPreset = await LiabilityPreset.deploy(deployments.LiabilityRegistry);
  await liabilityPreset.deploymentTransaction().wait(config.confirmations);
  deployments.LiabilityPreset = await liabilityPreset.getAddress();
  console.log(`   ✅ ${deployments.LiabilityPreset}\n`);

  // 6. AgentLifecycle (依赖 AIAgentRegistry)
  console.log('📄 6/8 Deploying AgentLifecycle...');
  const AgentLifecycle = await ethers.getContractFactory("contracts/AgentLifecycle.sol:AgentLifecycle");
  const agentLifecycle = await AgentLifecycle.deploy(existingAddresses.AIAgentRegistry);
  await agentLifecycle.deploymentTransaction().wait(config.confirmations);
  deployments.AgentLifecycle = await agentLifecycle.getAddress();
  console.log(`   ✅ ${deployments.AgentLifecycle}\n`);

  // 7. AgentRuntime (依赖 AgentLifecycle, AgentCommunity)
  console.log('📄 7/8 Deploying AgentRuntime...');
  const AgentRuntime = await ethers.getContractFactory("contracts/AgentRuntime.sol:AgentRuntime");
  const agentRuntime = await AgentRuntime.deploy(
    deployments.AgentLifecycle,
    deployments.AgentCommunity
  );
  await agentRuntime.deploymentTransaction().wait(config.confirmations);
  deployments.AgentRuntime = await agentRuntime.getAddress();
  console.log(`   ✅ ${deployments.AgentRuntime}\n`);

  // 8. HumanEconomy (依赖 HumanRegistry, AgentLifecycle)
  console.log('📄 8/8 Deploying HumanEconomy...');
  const HumanEconomy = await ethers.getContractFactory("contracts/HumanEconomy.sol:HumanEconomy");
  const humanEconomy = await HumanEconomy.deploy(
    deployments.HumanRegistry,
    deployments.AgentLifecycle
  );
  await humanEconomy.deploymentTransaction().wait(config.confirmations);
  deployments.HumanEconomy = await humanEconomy.getAddress();
  console.log(`   ✅ ${deployments.HumanEconomy}\n`);

  // 合并所有部署信息
  const allDeployments = { ...existingAddresses, ...deployments };

  // 保存部署信息
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    contracts: allDeployments,
    timestamp: new Date().toISOString(),
    explorer: config.explorer
  };

  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment saved to: deployments/${network.name}.json`);

  // 同时保存最新部署
  const latestFile = path.join(deploymentsDir, 'latest.json');
  fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));

  // 打印摘要
  console.log('\n📋 New Deployment Summary');
  console.log('═══════════════════════════════════════════════════');
  for (const [name, address] of Object.entries(deployments)) {
    console.log(`${name.padEnd(20)} ${address}`);
    if (config.explorer) {
      console.log(`${''.padEnd(20)} ${config.explorer}/address/${address}`);
    }
  }
  console.log('═══════════════════════════════════════════════════');

  console.log('\n📋 All Contracts Summary');
  console.log('═══════════════════════════════════════════════════');
  for (const [name, address] of Object.entries(allDeployments)) {
    console.log(`${name.padEnd(20)} ${address}`);
  }
  console.log('═══════════════════════════════════════════════════');

  // 自动验证合约
  if (config.verify) {
    console.log('\n🔍 Starting contract verification...');
    console.log('───────────────────────────────────────────────────');

    const contractsToVerify = [
      { name: 'HumanRegistry', address: deployments.HumanRegistry, args: [] },
      { name: 'AgentCommunity', address: deployments.AgentCommunity, args: [] },
      { name: 'CommunityGovernance', address: deployments.CommunityGovernance, args: [] },
      { name: 'LiabilityRegistry', address: deployments.LiabilityRegistry, args: [] },
      { name: 'LiabilityPreset', address: deployments.LiabilityPreset, args: [deployments.LiabilityRegistry] },
      { name: 'AgentLifecycle', address: deployments.AgentLifecycle, args: [existingAddresses.AIAgentRegistry] },
      { name: 'AgentRuntime', address: deployments.AgentRuntime, args: [deployments.AgentLifecycle, deployments.AgentCommunity] },
      { name: 'HumanEconomy', address: deployments.HumanEconomy, args: [deployments.HumanRegistry, deployments.AgentLifecycle] },
    ];

    for (const contract of contractsToVerify) {
      console.log(`\n📋 Verifying ${contract.name}...`);
      try {
        await hre.run("verify:verify", {
          address: contract.address,
          constructorArguments: contract.args,
        });
        console.log(`   ✅ ${contract.name} verified successfully`);
      } catch (error) {
        if (error.message.includes("Already Verified")) {
          console.log(`   ⚠️  ${contract.name} already verified`);
        } else {
          console.error(`   ❌ ${contract.name} verification failed:`, error.message);
        }
      }
    }
    console.log('\n───────────────────────────────────────────────────');
  }

  // 更新 .env 文件提示
  console.log('\n📝 Update your .env file with:');
  const envPrefix = network.name.toUpperCase();
  for (const [name, address] of Object.entries(deployments)) {
    const envName = name
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .replace(/^_/, '');
    console.log(`${envPrefix}_${envName}_ADDRESS=${address}`);
  }
}

main()
  .then(() => {
    console.log('\n✨ All contracts deployed!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  });

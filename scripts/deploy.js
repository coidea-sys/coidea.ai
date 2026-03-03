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
  },
  polygon: {
    name: 'Polygon Mainnet',
    confirmations: 5,
    verify: true,
    explorer: 'https://polygonscan.com'
  }
};

async function main() {
  const config = NETWORK_CONFIG[network.name];
  if (!config) {
    throw new Error(`Unknown network: ${network.name}`);
  }

  console.log(`\n🚀 Deploying to: ${config.name}`);
  console.log(`   Chain ID: ${network.config.chainId}`);
  console.log(`   RPC: ${network.config.url || 'built-in'}\n`);

  // 获取签名者
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // 检查余额
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ${network.name === 'polygon' ? 'POL' : 'ETH/POL'}\n`);

  if (balance === 0n && network.name !== 'hardhat') {
    console.error(`❌ Insufficient balance! Get ${network.name === 'polygonAmoy' ? 'testnet POL from faucet' : 'POL from exchange'}`);
    process.exit(1);
  }

  // 部署合约
  const deployments = {};

  // 1. AIAgentRegistry
  console.log('📄 Deploying AIAgentRegistry...');
  const AIAgentRegistry = await ethers.getContractFactory("AIAgentRegistry");
  const registry = await AIAgentRegistry.deploy(deployer.address);
  await registry.deploymentTransaction().wait(config.confirmations);
  deployments.AIAgentRegistry = await registry.getAddress();
  console.log(`   ✅ ${deployments.AIAgentRegistry}\n`);

  // 2. HumanLevelNFT
  console.log('📄 Deploying HumanLevelNFT...');
  const HumanLevelNFT = await ethers.getContractFactory("HumanLevelNFT");
  const humanNFT = await HumanLevelNFT.deploy();
  await humanNFT.deploymentTransaction().wait(config.confirmations);
  deployments.HumanLevelNFT = await humanNFT.getAddress();
  console.log(`   ✅ ${deployments.HumanLevelNFT}\n`);

  // 3. TaskRegistry
  console.log('📄 Deploying TaskRegistry...');
  const TaskRegistry = await ethers.getContractFactory("TaskRegistry");
  const taskRegistry = await TaskRegistry.deploy(deployer.address);
  await taskRegistry.deploymentTransaction().wait(config.confirmations);
  deployments.TaskRegistry = await taskRegistry.getAddress();
  console.log(`   ✅ ${deployments.TaskRegistry}\n`);

  // 4. X402Payment
  console.log('📄 Deploying X402Payment...');
  const X402Payment = await ethers.getContractFactory("X402Payment");
  const x402 = await X402Payment.deploy(deployer.address);
  await x402.deploymentTransaction().wait(config.confirmations);
  deployments.X402Payment = await x402.getAddress();
  console.log(`   ✅ ${deployments.X402Payment}\n`);

  // 保存部署信息
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
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
  console.log(`💾 Deployment saved to: deployments/${network.name}.json`);

  // 同时保存最新部署
  const latestFile = path.join(deploymentsDir, 'latest.json');
  fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));

  // 打印摘要
  console.log('\n📋 Deployment Summary');
  console.log('═══════════════════════════════════════════════════');
  for (const [name, address] of Object.entries(deployments)) {
    console.log(`${name.padEnd(20)} ${address}`);
    if (config.explorer) {
      console.log(`${''.padEnd(20)} ${config.explorer}/address/${address}`);
    }
  }
  console.log('═══════════════════════════════════════════════════');

  // 自动验证合约
  if (config.verify) {
    console.log('\n🔍 Starting contract verification...');
    console.log('───────────────────────────────────────────────────');

    const contractsToVerify = [
      { name: 'AIAgentRegistry', address: deployments.AIAgentRegistry, args: [deployer.address] },
      { name: 'HumanLevelNFT', address: deployments.HumanLevelNFT, args: [] },
      { name: 'TaskRegistry', address: deployments.TaskRegistry, args: [deployer.address] },
      { name: 'X402Payment', address: deployments.X402Payment, args: [deployer.address] },
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
          console.log(`      Manual verify: npx hardhat verify --network ${network.name} ${contract.address}`);
        }
      }
    }
    console.log('\n───────────────────────────────────────────────────');
  }

  // 更新 .env 文件提示
  console.log('\n📝 Update your .env file with:');
  const envPrefix = network.name.toUpperCase();
  for (const [name, address] of Object.entries(deployments)) {
    // 转换 CamelCase 为 UPPER_SNAKE_CASE
    const envName = name
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .replace(/^_/, ''); // 移除开头的下划线
    console.log(`${envPrefix}_${envName}_ADDRESS=${address}`);
  }
}

main()
  .then(() => {
    console.log('\n✨ Deployment complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  });

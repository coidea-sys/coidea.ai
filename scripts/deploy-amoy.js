const { ethers, network } = require("hardhat");
const fs = require('fs');
const path = require('path');

/**
 * @title Amoy Testnet Deployment Script
 * @notice 一键部署所有合约到 Amoy 测试网
 * 
 * 前置条件：
 * 1. .env 文件中配置 PRIVATE_KEY（有 Amoy POL 的钱包）
 * 2. .env 文件中配置 POLYGONSCAN_API_KEY（可选，用于验证）
 */

async function main() {
  console.log("\n🚀 Deploying to Polygon Amoy Testnet\n");
  
  // 检查网络
  if (network.name !== 'amoy') {
    console.error("❌ Please run with --network amoy");
    console.log("   npx hardhat run scripts/deploy-amoy.js --network amoy");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} POL`);
  
  if (balance < ethers.parseEther("1")) {
    console.error("\n❌ Insufficient POL!");
    console.log("   Get testnet POL from:");
    console.log("   - https://faucet.polygon.technology");
    console.log("   - https://www.alchemy.com/faucets/polygon-amoy");
    console.log("   - https://faucet.quicknode.com/polygon/amoy");
    process.exit(1);
  }

  console.log("\n📦 Deploying Contracts...\n");

  const deployments = {};
  const feeRecipient = deployer.address; // 初始手续费接收地址

  // 1. Deploy LiabilityRegistry
  console.log("1/5 Deploying LiabilityRegistry...");
  const LiabilityRegistry = await ethers.getContractFactory("LiabilityRegistry");
  const liabilityRegistry = await LiabilityRegistry.deploy(feeRecipient);
  await liabilityRegistry.waitForDeployment();
  deployments.LiabilityRegistry = await liabilityRegistry.getAddress();
  console.log(`   ✅ ${deployments.LiabilityRegistry}`);

  // 2. Deploy AIAgentRegistry
  console.log("2/5 Deploying AIAgentRegistry...");
  const AIAgentRegistry = await ethers.getContractFactory("AIAgentRegistry");
  const agentRegistry = await AIAgentRegistry.deploy(feeRecipient);
  await agentRegistry.waitForDeployment();
  deployments.AIAgentRegistry = await agentRegistry.getAddress();
  console.log(`   ✅ ${deployments.AIAgentRegistry}`);

  // 3. Deploy HumanLevelNFT
  console.log("3/5 Deploying HumanLevelNFT...");
  const HumanLevelNFT = await ethers.getContractFactory("HumanLevelNFT");
  const humanNFT = await HumanLevelNFT.deploy();
  await humanNFT.waitForDeployment();
  deployments.HumanLevelNFT = await humanNFT.getAddress();
  console.log(`   ✅ ${deployments.HumanLevelNFT}`);

  // 4. Deploy TaskRegistryWithLiability
  console.log("4/5 Deploying TaskRegistryWithLiability...");
  const TaskRegistry = await ethers.getContractFactory("TaskRegistryWithLiability");
  const taskRegistry = await TaskRegistry.deploy(feeRecipient);
  await taskRegistry.waitForDeployment();
  deployments.TaskRegistryWithLiability = await taskRegistry.getAddress();
  console.log(`   ✅ ${deployments.TaskRegistryWithLiability}`);

  // 5. Deploy X402Payment
  console.log("5/5 Deploying X402Payment...");
  const X402Payment = await ethers.getContractFactory("X402Payment");
  const x402 = await X402Payment.deploy(feeRecipient);
  await x402.waitForDeployment();
  deployments.X402Payment = await x402.getAddress();
  console.log(`   ✅ ${deployments.X402Payment}`);

  // 设置合约间引用
  console.log("\n🔗 Configuring Contract References...");
  
  await (await taskRegistry.setLiabilityRegistry(deployments.LiabilityRegistry)).wait();
  console.log("   ✅ TaskRegistry → LiabilityRegistry");

  // 保存部署信息
  const deploymentInfo = {
    network: network.name,
    chainId: 80002,
    deployer: deployer.address,
    contracts: deployments,
    timestamp: new Date().toISOString(),
    explorer: "https://amoy.polygonscan.com"
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, 'amoy.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  fs.writeFileSync(
    path.join(deploymentsDir, 'latest.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // 更新 .env 文件
  console.log("\n📝 Updating .env file...");
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // 更新或添加 Amoy 合约地址
  const envVars = {
    'AMOY_LIABILITY_REGISTRY_ADDRESS': deployments.LiabilityRegistry,
    'AMOY_AI_AGENT_REGISTRY_ADDRESS': deployments.AIAgentRegistry,
    'AMOY_HUMAN_LEVEL_NFT_ADDRESS': deployments.HumanLevelNFT,
    'AMOY_TASK_REGISTRY_ADDRESS': deployments.TaskRegistryWithLiability,
    'AMOY_X402_PAYMENT_ADDRESS': deployments.X402Payment
  };

  for (const [key, value] of Object.entries(envVars)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, envContent);
  console.log("   ✅ .env updated");

  // 打印摘要
  console.log("\n" + "=".repeat(60));
  console.log("📋 Deployment Summary - Polygon Amoy");
  console.log("=".repeat(60));
  for (const [name, address] of Object.entries(deployments)) {
    console.log(`${name.padEnd(30)} ${address}`);
    console.log(`${''.padEnd(30)} https://amoy.polygonscan.com/address/${address}`);
    console.log();
  }
  console.log("=".repeat(60));

  // 验证提示
  console.log("\n🔍 To verify contracts on PolygonScan:");
  console.log("   npx hardhat verify --network amoy <address> [constructor args]");
  console.log("\n   Or run:");
  console.log("   npm run verify:amoy");

  console.log("\n✨ Amoy deployment complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error.message);
    process.exit(1);
  });

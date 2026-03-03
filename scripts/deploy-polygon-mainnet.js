/**
 * Polygon Mainnet Deployment Script
 * Deploy coidea.ai contracts to Polygon mainnet
 */

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Starting Polygon Mainnet Deployment...\n");
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await deployer.provider.getBalance(deployerAddress);
  
  console.log("📋 Deployment Info:");
  console.log("  Network:", network.name);
  console.log("  Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("  Deployer:", deployerAddress);
  console.log("  Balance:", ethers.formatEther(balance), "MATIC");
  console.log("");
  
  // Check balance
  if (balance < ethers.parseEther("0.5")) {
    console.error("❌ Insufficient balance. Need at least 0.5 MATIC for deployment");
    process.exit(1);
  }
  
  const deployedContracts = {};
  
  try {
    // Deploy AIAgentRegistry
    console.log("📦 Deploying AIAgentRegistry...");
    const AIAgentRegistry = await ethers.getContractFactory("AIAgentRegistry");
    const aiAgentRegistry = await AIAgentRegistry.deploy(deployerAddress);
    await aiAgentRegistry.waitForDeployment();
    deployedContracts.AIAgentRegistry = await aiAgentRegistry.getAddress();
    console.log("  ✅ AIAgentRegistry:", deployedContracts.AIAgentRegistry);
    
    // Deploy HumanLevelNFT
    console.log("📦 Deploying HumanLevelNFT...");
    const HumanLevelNFT = await ethers.getContractFactory("HumanLevelNFT");
    const humanLevelNFT = await HumanLevelNFT.deploy();
    await humanLevelNFT.waitForDeployment();
    deployedContracts.HumanLevelNFT = await humanLevelNFT.getAddress();
    console.log("  ✅ HumanLevelNFT:", deployedContracts.HumanLevelNFT);
    
    // Deploy TaskRegistry
    console.log("📦 Deploying TaskRegistry...");
    const TaskRegistry = await ethers.getContractFactory("TaskRegistry");
    const taskRegistry = await TaskRegistry.deploy(deployerAddress);
    await taskRegistry.waitForDeployment();
    deployedContracts.TaskRegistry = await taskRegistry.getAddress();
    console.log("  ✅ TaskRegistry:", deployedContracts.TaskRegistry);
    
    // Deploy X402Payment
    console.log("📦 Deploying X402Payment...");
    const X402Payment = await ethers.getContractFactory("X402Payment");
    const x402Payment = await X402Payment.deploy(deployerAddress);
    await x402Payment.waitForDeployment();
    deployedContracts.X402Payment = await x402Payment.getAddress();
    console.log("  ✅ X402Payment:", deployedContracts.X402Payment);
    
    // Save deployment info
    const deploymentInfo = {
      network: network.name,
      chainId: (await ethers.provider.getNetwork()).chainId,
      deployer: deployerAddress,
      timestamp: new Date().toISOString(),
      contracts: deployedContracts
    };
    
    const deploymentPath = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(deploymentPath, `polygon-${Date.now()}.json`),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    fs.writeFileSync(
      path.join(deploymentPath, 'polygon-latest.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n✅ Deployment completed successfully!");
    console.log("\n📄 Contract Addresses:");
    console.log("  AIAgentRegistry:", deployedContracts.AIAgentRegistry);
    console.log("  HumanLevelNFT:", deployedContracts.HumanLevelNFT);
    console.log("  TaskRegistry:", deployedContracts.TaskRegistry);
    console.log("  X402Payment:", deployedContracts.X402Payment);
    
    console.log("\n🔍 Verification Commands:");
    console.log(`  npx hardhat verify --network polygon ${deployedContracts.AIAgentRegistry} ${deployerAddress}`);
    console.log(`  npx hardhat verify --network polygon ${deployedContracts.HumanLevelNFT}`);
    console.log(`  npx hardhat verify --network polygon ${deployedContracts.TaskRegistry} ${deployerAddress}`);
    console.log(`  npx hardhat verify --network polygon ${deployedContracts.X402Payment} ${deployerAddress}`);
    
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

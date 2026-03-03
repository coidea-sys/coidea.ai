/**
 * Mainnet Deployment Script
 * Deploy contracts to Polygon Mainnet
 */

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Starting Mainnet Deployment...\n");
  
  // Check environment
  if (!process.env.MAINNET_PRIVATE_KEY) {
    throw new Error("MAINNET_PRIVATE_KEY not set");
  }
  
  if (!process.env.POLYGONSCAN_API_KEY) {
    throw new Error("POLYGONSCAN_API_KEY not set");
  }
  
  const [deployer] = await ethers.getSigners();
  console.log("📦 Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MATIC");
  
  if (balance < ethers.parseEther("0.5")) {
    throw new Error("Insufficient balance for deployment. Need at least 0.5 MATIC");
  }
  
  console.log("\n📋 Deployment Plan:");
  console.log("1. AIAgentRegistry");
  console.log("2. HumanLevelNFT");
  console.log("3. TaskRegistry");
  console.log("4. X402Payment");
  console.log("");
  
  // Confirm deployment
  console.log("⚠️  This will deploy to POLYGON MAINNET");
  console.log("⚠️  Make sure you have sufficient MATIC for gas");
  console.log("");
  
  // Wait for user confirmation in real scenario
  // For now, we'll proceed with deployment
  
  const deployedContracts = {};
  
  // 1. Deploy AIAgentRegistry
  console.log("📝 Deploying AIAgentRegistry...");
  const AIAgentRegistry = await ethers.getContractFactory("AIAgentRegistry");
  const agentRegistry = await AIAgentRegistry.deploy(deployer.address);
  await agentRegistry.waitForDeployment();
  const agentRegistryAddress = await agentRegistry.getAddress();
  deployedContracts.AIAgentRegistry = agentRegistryAddress;
  console.log("✅ AIAgentRegistry deployed to:", agentRegistryAddress);
  
  // 2. Deploy HumanLevelNFT
  console.log("📝 Deploying HumanLevelNFT...");
  const HumanLevelNFT = await ethers.getContractFactory("HumanLevelNFT");
  const humanNFT = await HumanLevelNFT.deploy();
  await humanNFT.waitForDeployment();
  const humanNFTAddress = await humanNFT.getAddress();
  deployedContracts.HumanLevelNFT = humanNFTAddress;
  console.log("✅ HumanLevelNFT deployed to:", humanNFTAddress);
  
  // 3. Deploy TaskRegistry
  console.log("📝 Deploying TaskRegistry...");
  const TaskRegistry = await ethers.getContractFactory("TaskRegistry");
  const taskRegistry = await TaskRegistry.deploy(deployer.address);
  await taskRegistry.waitForDeployment();
  const taskRegistryAddress = await taskRegistry.getAddress();
  deployedContracts.TaskRegistry = taskRegistryAddress;
  console.log("✅ TaskRegistry deployed to:", taskRegistryAddress);
  
  // 4. Deploy X402Payment
  console.log("📝 Deploying X402Payment...");
  const X402Payment = await ethers.getContractFactory("X402Payment");
  const x402Payment = await X402Payment.deploy(deployer.address);
  await x402Payment.waitForDeployment();
  const x402PaymentAddress = await x402Payment.getAddress();
  deployedContracts.X402Payment = x402PaymentAddress;
  console.log("✅ X402Payment deployed to:", x402PaymentAddress);
  
  // Save deployment info
  const deploymentInfo = {
    network: "polygon",
    chainId: 137,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: deployedContracts,
    verification: {
      etherscan: "https://polygonscan.com",
      sourcify: "https://sourcify.dev"
    }
  };
  
  const deploymentPath = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(deploymentPath, 'mainnet-deployment.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n📄 Deployment info saved to deployments/mainnet-deployment.json");
  
  // Verification instructions
  console.log("\n🔍 Verification Commands:");
  console.log("------------------------");
  console.log(`npx hardhat verify --network polygon ${agentRegistryAddress} ${deployer.address}`);
  console.log(`npx hardhat verify --network polygon ${humanNFTAddress}`);
  console.log(`npx hardhat verify --network polygon ${taskRegistryAddress} ${deployer.address}`);
  console.log(`npx hardhat verify --network polygon ${x402PaymentAddress} ${deployer.address}`);
  console.log("");
  
  console.log("🎉 Mainnet Deployment Complete!");
  console.log("");
  console.log("⚠️  IMPORTANT NEXT STEPS:");
  console.log("1. Verify contracts on PolygonScan");
  console.log("2. Verify contracts on Sourcify");
  console.log("3. Update frontend contract addresses");
  console.log("4. Test on mainnet");
  console.log("5. Monitor for anomalies");
  
  return deploymentInfo;
}

main()
  .then((info) => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

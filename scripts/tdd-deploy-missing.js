/**
 * TDD Deployment Script - Missing Contracts
 * Deploy HumanLevelNFT and LiabilityRegistry to complete TDD cycle
 * 
 * TDD Steps:
 * 1. Write tests (Red) ✅ - missing-contracts.test.js
 * 2. Deploy contracts (Green) 🔄 - This script
 * 3. Verify on Amoy (Refactor) ⏳ - Manual verification
 * 4. Deploy to Mainnet ✅ - Production ready
 */

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function deployToAmoy() {
  console.log("🧪 TDD Step 2: Deploy Missing Contracts to Amoy (Green Phase)\n");
  
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  console.log("📋 Deployment Info:");
  console.log("  Network: Polygon Amoy Testnet");
  console.log("  Deployer:", deployerAddress);
  console.log("");

  const deployed = {};

  try {
    // Deploy HumanLevelNFT
    console.log("📦 Deploying HumanLevelNFT...");
    const HumanLevelNFT = await ethers.getContractFactory("HumanLevelNFT");
    const humanLevelNFT = await HumanLevelNFT.deploy();
    await humanLevelNFT.waitForDeployment();
    deployed.HumanLevelNFT = await humanLevelNFT.getAddress();
    console.log("  ✅ HumanLevelNFT:", deployed.HumanLevelNFT);

    // Deploy LiabilityRegistry
    console.log("📦 Deploying LiabilityRegistry...");
    const LiabilityRegistry = await ethers.getContractFactory("LiabilityRegistry");
    const liabilityRegistry = await LiabilityRegistry.deploy(deployerAddress);
    await liabilityRegistry.waitForDeployment();
    deployed.LiabilityRegistry = await liabilityRegistry.getAddress();
    console.log("  ✅ LiabilityRegistry:", deployed.LiabilityRegistry);

    // Save deployment
    const deploymentInfo = {
      network: 'polygonAmoy',
      chainId: 80002,
      deployer: deployerAddress,
      timestamp: new Date().toISOString(),
      contracts: deployed,
      tddPhase: 'Green - Contracts Deployed'
    };

    const deploymentPath = path.join(__dirname, '../deployments/amoy');
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }

    fs.writeFileSync(
      path.join(deploymentPath, 'missing-contracts.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n✅ TDD Green Phase Complete!");
    console.log("\n📄 Deployed Addresses:");
    console.log("  HumanLevelNFT:", deployed.HumanLevelNFT);
    console.log("  LiabilityRegistry:", deployed.LiabilityRegistry);

    console.log("\n🔍 Next Steps (TDD Refactor Phase):");
    console.log("  1. Update test file with deployed addresses");
    console.log("  2. Run integration tests");
    console.log("  3. Verify contracts on Amoy");
    console.log("  4. Deploy to Mainnet");

    return deployed;

  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    throw error;
  }
}

async function deployToMainnet() {
  console.log("🚀 TDD Final Step: Deploy to Polygon Mainnet\n");
  
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  console.log("📋 Deployment Info:");
  console.log("  Network: Polygon Mainnet");
  console.log("  Deployer:", deployerAddress);
  console.log("");

  // Verify we're on mainnet
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 137n) {
    throw new Error("Not on Polygon mainnet!");
  }

  const deployed = {};

  try {
    // Deploy HumanLevelNFT
    console.log("📦 Deploying HumanLevelNFT to Mainnet...");
    const HumanLevelNFT = await ethers.getContractFactory("HumanLevelNFT");
    const humanLevelNFT = await HumanLevelNFT.deploy();
    await humanLevelNFT.waitForDeployment();
    deployed.HumanLevelNFT = await humanLevelNFT.getAddress();
    console.log("  ✅ HumanLevelNFT:", deployed.HumanLevelNFT);

    // Deploy LiabilityRegistry
    console.log("📦 Deploying LiabilityRegistry to Mainnet...");
    const LiabilityRegistry = await ethers.getContractFactory("LiabilityRegistry");
    const liabilityRegistry = await LiabilityRegistry.deploy(deployerAddress);
    await liabilityRegistry.waitForDeployment();
    deployed.LiabilityRegistry = await liabilityRegistry.getAddress();
    console.log("  ✅ LiabilityRegistry:", deployed.LiabilityRegistry);

    // Save deployment
    const deploymentInfo = {
      network: 'polygon',
      chainId: 137,
      deployer: deployerAddress,
      timestamp: new Date().toISOString(),
      contracts: deployed,
      tddPhase: 'Complete - Production Deployed'
    };

    const deploymentPath = path.join(__dirname, '../deployments/polygon');
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }

    fs.writeFileSync(
      path.join(deploymentPath, 'missing-contracts-mainnet.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n✅ TDD Complete! All Contracts Deployed to Mainnet!");
    console.log("\n📄 Mainnet Addresses:");
    console.log("  HumanLevelNFT:", deployed.HumanLevelNFT);
    console.log("  LiabilityRegistry:", deployed.LiabilityRegistry);

    return deployed;

  } catch (error) {
    console.error("\n❌ Mainnet deployment failed:", error.message);
    throw error;
  }
}

// Main execution
async function main() {
  const network = hre.network.name;
  
  if (network === 'polygonAmoy') {
    await deployToAmoy();
  } else if (network === 'polygon') {
    await deployToMainnet();
  } else {
    console.log("Usage:");
    console.log("  npx hardhat run scripts/tdd-deploy-missing.js --network polygonAmoy");
    console.log("  npx hardhat run scripts/tdd-deploy-missing.js --network polygon");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

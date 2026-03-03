const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying missing contracts to Polygon Mainnet...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "MATIC\n");

  const deployments = {};

  // 1. Deploy HumanLevelNFT
  console.log("📜 Deploying HumanLevelNFT...");
  const HumanLevelNFT = await hre.ethers.getContractFactory("HumanLevelNFT");
  const humanLevelNFT = await HumanLevelNFT.deploy();
  await humanLevelNFT.waitForDeployment();
  const humanLevelNFTAddress = await humanLevelNFT.getAddress();
  deployments.HumanLevelNFT = humanLevelNFTAddress;
  console.log("✅ HumanLevelNFT deployed to:", humanLevelNFTAddress);

  // 2. Deploy LiabilityRegistry
  console.log("\n📜 Deploying LiabilityRegistry...");
  const LiabilityRegistry = await hre.ethers.getContractFactory("LiabilityRegistry");
  const liabilityRegistry = await LiabilityRegistry.deploy();
  await liabilityRegistry.waitForDeployment();
  const liabilityRegistryAddress = await liabilityRegistry.getAddress();
  deployments.LiabilityRegistry = liabilityRegistryAddress;
  console.log("✅ LiabilityRegistry deployed to:", liabilityRegistryAddress);

  // Wait for confirmations
  console.log("\n⏳ Waiting for 5 confirmations...");
  await humanLevelNFT.deploymentTransaction().wait(5);
  await liabilityRegistry.deploymentTransaction().wait(5);
  console.log("✅ Confirmations received\n");

  // Update deployment file
  const deploymentPath = path.join(__dirname, '../deployment-polygon.json');
  let existingDeployments = {};
  
  if (fs.existsSync(deploymentPath)) {
    existingDeployments = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  }

  const updatedDeployments = {
    ...existingDeployments,
    ...deployments,
    lastUpdated: new Date().toISOString()
  };

  fs.writeFileSync(deploymentPath, JSON.stringify(updatedDeployments, null, 2));
  console.log("📝 Deployment addresses saved to deployment-polygon.json");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("\n📋 New Contract Addresses:");
  console.log("  HumanLevelNFT:", humanLevelNFTAddress);
  console.log("  LiabilityRegistry:", liabilityRegistryAddress);
  console.log("\n" + "=".repeat(60));

  return deployments;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

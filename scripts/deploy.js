const { ethers, network } = require("hardhat");

async function main() {
  console.log("Network:", network.name);
  console.log("Chain ID:", network.config.chainId);
  
  const signers = await ethers.getSigners();
  console.log("Number of signers:", signers.length);
  
  if (signers.length === 0) {
    console.error("No signers found! Check PRIVATE_KEY in .env");
    process.exit(1);
  }
  
  const [deployer] = signers;
  
  console.log("Deploying contracts with the account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "POL");

  // Deploy AIAgentRegistry
  console.log("\nDeploying AIAgentRegistry...");
  const AIAgentRegistry = await ethers.getContractFactory("AIAgentRegistry");
  const registry = await AIAgentRegistry.deploy(deployer.address);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("AIAgentRegistry deployed to:", registryAddress);

  // Deploy HumanLevelNFT
  console.log("\nDeploying HumanLevelNFT...");
  const HumanLevelNFT = await ethers.getContractFactory("HumanLevelNFT");
  const humanNFT = await HumanLevelNFT.deploy();
  await humanNFT.waitForDeployment();
  const humanNFTAddress = await humanNFT.getAddress();
  console.log("HumanLevelNFT deployed to:", humanNFTAddress);

  // Deploy TaskRegistry
  console.log("\nDeploying TaskRegistry...");
  const TaskRegistry = await ethers.getContractFactory("TaskRegistry");
  const taskRegistry = await TaskRegistry.deploy(deployer.address);
  await taskRegistry.waitForDeployment();
  const taskRegistryAddress = await taskRegistry.getAddress();
  console.log("TaskRegistry deployed to:", taskRegistryAddress);

  // Deploy X402Payment
  console.log("\nDeploying X402Payment...");
  const X402Payment = await ethers.getContractFactory("X402Payment");
  const x402 = await X402Payment.deploy(deployer.address);
  await x402.waitForDeployment();
  const x402Address = await x402.getAddress();
  console.log("X402Payment deployed to:", x402Address);

  console.log("\n=== Deployment Summary ===");
  console.log("AIAgentRegistry:", registryAddress);
  console.log("HumanLevelNFT:", humanNFTAddress);
  console.log("TaskRegistry:", taskRegistryAddress);
  console.log("X402Payment:", x402Address);
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    contracts: {
      AIAgentRegistry: registryAddress,
      HumanLevelNFT: humanNFTAddress,
      TaskRegistry: taskRegistryAddress,
      X402Payment: x402Address
    },
    timestamp: new Date().toISOString()
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    `deployment-${network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployment-" + network.name + ".json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

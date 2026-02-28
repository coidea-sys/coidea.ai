const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy AIAgentRegistry
  console.log("\nDeploying AIAgentRegistry...");
  const AIAgentRegistry = await hre.ethers.getContractFactory("AIAgentRegistry");
  const registry = await AIAgentRegistry.deploy(deployer.address);
  await registry.waitForDeployment();
  console.log("AIAgentRegistry deployed to:", await registry.getAddress());

  // Deploy HumanLevelNFT
  console.log("\nDeploying HumanLevelNFT...");
  const HumanLevelNFT = await hre.ethers.getContractFactory("HumanLevelNFT");
  const humanNFT = await HumanLevelNFT.deploy();
  await humanNFT.waitForDeployment();
  console.log("HumanLevelNFT deployed to:", await humanNFT.getAddress());

  // Deploy TaskRegistry
  console.log("\nDeploying TaskRegistry...");
  const TaskRegistry = await hre.ethers.getContractFactory("TaskRegistry");
  const taskRegistry = await TaskRegistry.deploy(deployer.address);
  await taskRegistry.waitForDeployment();
  console.log("TaskRegistry deployed to:", await taskRegistry.getAddress());

  // Deploy X402Payment
  console.log("\nDeploying X402Payment...");
  const X402Payment = await hre.ethers.getContractFactory("X402Payment");
  const x402 = await X402Payment.deploy(deployer.address);
  await x402.waitForDeployment();
  console.log("X402Payment deployed to:", await x402.getAddress());

  console.log("\n=== Deployment Summary ===");
  console.log("AIAgentRegistry:", await registry.getAddress());
  console.log("HumanLevelNFT:", await humanNFT.getAddress());
  console.log("TaskRegistry:", await taskRegistry.getAddress());
  console.log("X402Payment:", await x402.getAddress());
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    contracts: {
      AIAgentRegistry: await registry.getAddress(),
      HumanLevelNFT: await humanNFT.getAddress(),
      TaskRegistry: await taskRegistry.getAddress(),
      X402Payment: await x402.getAddress()
    },
    timestamp: new Date().toISOString()
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    `deployment-${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployment-" + hre.network.name + ".json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

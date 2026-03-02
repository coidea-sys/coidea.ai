const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "MATIC");
  
  // 已部署的合约地址
  const agentRegistryAddress = "0xdb36268016302Ca6abcBcD45CB206e88Ee358fD6";
  const communityGovernanceAddress = "0x6AA35Fee046412830E371111Ddb15B74A145dF01";
  const platformTreasury = deployer.address; // 暂时用部署者地址
  
  console.log("\n=== Deploying HumanRegistry ===");
  const HumanRegistry = await hre.ethers.getContractFactory("HumanRegistry");
  const humanRegistry = await HumanRegistry.deploy(platformTreasury);
  await humanRegistry.waitForDeployment();
  console.log("HumanRegistry deployed to:", await humanRegistry.getAddress());
  
  console.log("\n=== Deploying HumanEconomy ===");
  const HumanEconomy = await hre.ethers.getContractFactory("HumanEconomy");
  const humanEconomy = await HumanEconomy.deploy(
    await humanRegistry.getAddress(),
    platformTreasury, // 临时用，后续替换为 AgentLifecycle
    platformTreasury
  );
  await humanEconomy.waitForDeployment();
  console.log("HumanEconomy deployed to:", await humanEconomy.getAddress());
  
  console.log("\n=== Deploying AgentLifecycle ===");
  const AgentLifecycle = await hre.ethers.getContractFactory("AgentLifecycle");
  const agentLifecycle = await AgentLifecycle.deploy(
    agentRegistryAddress,
    platformTreasury
  );
  await agentLifecycle.waitForDeployment();
  console.log("AgentLifecycle deployed to:", await agentLifecycle.getAddress());
  
  console.log("\n=== Deploying AgentRuntime ===");
  const AgentRuntime = await hre.ethers.getContractFactory("AgentRuntime");
  const agentRuntime = await AgentRuntime.deploy();
  await agentRuntime.waitForDeployment();
  console.log("AgentRuntime deployed to:", await agentRuntime.getAddress());
  
  console.log("\n=== Deploying AgentCommunity ===");
  const AgentCommunity = await hre.ethers.getContractFactory("AgentCommunity");
  const agentCommunity = await AgentCommunity.deploy(
    agentRegistryAddress,
    communityGovernanceAddress
  );
  await agentCommunity.waitForDeployment();
  console.log("AgentCommunity deployed to:", await agentCommunity.getAddress());
  
  console.log("\n=== Deployment Summary ===");
  console.log("{");
  console.log(`  "HumanRegistry": "${await humanRegistry.getAddress()}"`);
  console.log(`  "HumanEconomy": "${await humanEconomy.getAddress()}"`);
  console.log(`  "AgentLifecycle": "${await agentLifecycle.getAddress()}"`);
  console.log(`  "AgentRuntime": "${await agentRuntime.getAddress()}"`);
  console.log(`  "AgentCommunity": "${await agentCommunity.getAddress()}"`);
  console.log("}");
  
  // 验证合约
  console.log("\n=== Waiting for block confirmations...");
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  console.log("\n=== Verification Commands ===");
  console.log(`npx hardhat verify --network polygon ${await humanRegistry.getAddress()} ${platformTreasury}`);
  console.log(`npx hardhat verify --network polygon ${await humanEconomy.getAddress()} ${await humanRegistry.getAddress()} ${platformTreasury} ${platformTreasury}`);
  console.log(`npx hardhat verify --network polygon ${await agentLifecycle.getAddress()} ${agentRegistryAddress} ${platformTreasury}`);
  console.log(`npx hardhat verify --network polygon ${await agentRuntime.getAddress()}`);
  console.log(`npx hardhat verify --network polygon ${await agentCommunity.getAddress()} ${agentRegistryAddress} ${communityGovernanceAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

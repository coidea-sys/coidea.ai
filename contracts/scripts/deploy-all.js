const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying coidea.ai contracts...");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  const deployments = {
    network: hre.network.name,
    chainId: Number(await hre.network.provider.request({ method: "eth_chainId" })),
    deployer: deployer.address,
    contracts: {},
    presets: {},
    deployedAt: new Date().toISOString()
  };

  // 1. Deploy LiabilityPreset
  console.log("📋 1/5 Deploying LiabilityPreset...");
  const LiabilityPreset = await hre.ethers.getContractFactory("LiabilityPreset");
  const liabilityPreset = await LiabilityPreset.deploy();
  await liabilityPreset.waitForDeployment();
  deployments.contracts.LiabilityPreset = await liabilityPreset.getAddress();
  console.log("   ✅ LiabilityPreset:", deployments.contracts.LiabilityPreset);

  // 2. Deploy AIAgentRegistry
  console.log("📋 2/5 Deploying AIAgentRegistry...");
  const AIAgentRegistry = await hre.ethers.getContractFactory("AIAgentRegistry");
  const agentRegistry = await AIAgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  deployments.contracts.AIAgentRegistry = await agentRegistry.getAddress();
  console.log("   ✅ AIAgentRegistry:", deployments.contracts.AIAgentRegistry);

  // 3. Deploy TaskRegistry
  console.log("📋 3/5 Deploying TaskRegistry...");
  const TaskRegistry = await hre.ethers.getContractFactory("TaskRegistry");
  const taskRegistry = await TaskRegistry.deploy();
  await taskRegistry.waitForDeployment();
  deployments.contracts.TaskRegistry = await taskRegistry.getAddress();
  console.log("   ✅ TaskRegistry:", deployments.contracts.TaskRegistry);

  // 4. Deploy X402Payment
  console.log("📋 4/5 Deploying X402Payment...");
  const X402Payment = await hre.ethers.getContractFactory("X402Payment");
  const x402Payment = await X402Payment.deploy(deployments.contracts.TaskRegistry);
  await x402Payment.waitForDeployment();
  deployments.contracts.X402Payment = await x402Payment.getAddress();
  console.log("   ✅ X402Payment:", deployments.contracts.X402Payment);

  // 5. Deploy CommunityGovernance
  console.log("📋 5/5 Deploying CommunityGovernance...");
  const CommunityGovernance = await hre.ethers.getContractFactory("CommunityGovernance");
  const communityGovernance = await CommunityGovernance.deploy(
    deployments.contracts.AIAgentRegistry,
    deployments.contracts.TaskRegistry
  );
  await communityGovernance.waitForDeployment();
  deployments.contracts.CommunityGovernance = await communityGovernance.getAddress();
  console.log("   ✅ CommunityGovernance:", deployments.contracts.CommunityGovernance);

  // Create default liability presets
  console.log("\n🔧 Creating default liability presets...");
  
  const presets = {
    STANDARD: hre.ethers.keccak256(hre.ethers.toUtf8Bytes("STANDARD")),
    LIMITED: hre.ethers.keccak256(hre.ethers.toUtf8Bytes("LIMITED")),
    INSURED: hre.ethers.keccak256(hre.ethers.toUtf8Bytes("INSURED")),
    BONDED: hre.ethers.keccak256(hre.ethers.toUtf8Bytes("BONDED"))
  };

  await liabilityPreset.createStandardPreset(presets.STANDARD, 7 * 24 * 60 * 60);
  console.log("   ✅ Standard preset");

  await liabilityPreset.createLimitedPreset(
    presets.LIMITED,
    hre.ethers.parseEther("0.05"),
    hre.ethers.parseEther("0.02"),
    7 * 24 * 60 * 60
  );
  console.log("   ✅ Limited preset");

  await liabilityPreset.createInsuredPreset(
    presets.INSURED,
    hre.ethers.parseEther("0.1"),
    hre.ethers.parseEther("0.01"),
    deployer.address,
    7 * 24 * 60 * 60
  );
  console.log("   ✅ Insured preset");

  await liabilityPreset.createBondedPreset(
    presets.BONDED,
    hre.ethers.parseEther("0.1"),
    hre.ethers.parseEther("0.1"),
    7 * 24 * 60 * 60
  );
  console.log("   ✅ Bonded preset");

  deployments.presets = presets;

  // Save deployment info
  const deploymentDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const filename = `${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentDir, filename),
    JSON.stringify(deployments, null, 2)
  );
  fs.writeFileSync(
    path.join(deploymentDir, 'latest.json'),
    JSON.stringify(deployments, null, 2)
  );

  // Output summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 ALL CONTRACTS DEPLOYED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log("\n📍 Contract Addresses:");
  Object.entries(deployments.contracts).forEach(([name, addr]) => {
    console.log(`  ${name.padEnd(20)} ${addr}`);
  });
  console.log("\n🔧 Liability Presets:");
  Object.entries(deployments.presets).forEach(([name, id]) => {
    console.log(`  ${name.padEnd(10)} ${id}`);
  });
  console.log("\n📝 Deployment saved to:", filename);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

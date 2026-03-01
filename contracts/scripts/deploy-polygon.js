const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying to Polygon Mainnet...");
  console.log("Deployer:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "MATIC");
  console.log("");

  // Check minimum balance (3 MATIC for deployment)
  const minBalance = hre.ethers.parseEther("3");
  if (balance < minBalance) {
    console.error("❌ Insufficient balance. Need at least 3 MATIC");
    process.exit(1);
  }

  const deployments = {
    network: "polygon",
    chainId: 137,
    deployer: deployer.address,
    contracts: {},
    proxies: {},
    deployedAt: new Date().toISOString()
  };

  // 1. Deploy ProxyFactory
  console.log("📋 1/6 Deploying CoideaProxyFactory...");
  const CoideaProxyFactory = await hre.ethers.getContractFactory("CoideaProxyFactory");
  const factory = await CoideaProxyFactory.deploy();
  await factory.waitForDeployment();
  deployments.contracts.ProxyFactory = await factory.getAddress();
  console.log("✅ ProxyFactory:", deployments.contracts.ProxyFactory);

  // 2. Deploy TaskRegistry Implementation
  console.log("\n📋 2/6 Deploying TaskRegistry Implementation...");
  const TaskRegistry = await hre.ethers.getContractFactory("TaskRegistryUpgradeable");
  const taskRegistryImpl = await TaskRegistry.deploy();
  await taskRegistryImpl.waitForDeployment();
  const taskRegistryImplAddress = await taskRegistryImpl.getAddress();
  console.log("✅ TaskRegistry Implementation:", taskRegistryImplAddress);

  // 3. Deploy TaskRegistry Proxy
  console.log("\n📋 3/6 Deploying TaskRegistry Proxy...");
  const initData = TaskRegistry.interface.encodeFunctionData("initialize", [deployer.address]);
  const tx = await factory.deployProxy("TaskRegistry", taskRegistryImplAddress, initData);
  await tx.wait();
  const taskRegistryProxy = await factory.getProxy("TaskRegistry");
  deployments.proxies.TaskRegistry = taskRegistryProxy;
  console.log("✅ TaskRegistry Proxy:", taskRegistryProxy);

  // 4. Deploy LiabilityPreset
  console.log("\n📋 4/6 Deploying LiabilityPreset...");
  const LiabilityPreset = await hre.ethers.getContractFactory("LiabilityPreset");
  const liabilityPreset = await LiabilityPreset.deploy();
  await liabilityPreset.waitForDeployment();
  deployments.contracts.LiabilityPreset = await liabilityPreset.getAddress();
  console.log("✅ LiabilityPreset:", deployments.contracts.LiabilityPreset);

  // 5. Create Default Presets
  console.log("\n📋 5/6 Creating default liability presets...");
  const presets = {
    STANDARD: hre.ethers.keccak256(hre.ethers.toUtf8Bytes("STANDARD")),
    LIMITED: hre.ethers.keccak256(hre.ethers.toUtf8Bytes("LIMITED")),
    INSURED: hre.ethers.keccak256(hre.ethers.toUtf8Bytes("INSURED")),
    BONDED: hre.ethers.keccak256(hre.ethers.toUtf8Bytes("BONDED"))
  };

  await liabilityPreset.createStandardPreset(presets.STANDARD, 7 * 24 * 60 * 60);
  console.log("✅ Standard preset");

  await liabilityPreset.createLimitedPreset(
    presets.LIMITED,
    hre.ethers.parseEther("0.05"),
    hre.ethers.parseEther("0.02"),
    7 * 24 * 60 * 60
  );
  console.log("✅ Limited preset");

  await liabilityPreset.createInsuredPreset(
    presets.INSURED,
    hre.ethers.parseEther("0.1"),
    hre.ethers.parseEther("0.01"),
    deployer.address,
    7 * 24 * 60 * 60
  );
  console.log("✅ Insured preset");

  await liabilityPreset.createBondedPreset(
    presets.BONDED,
    hre.ethers.parseEther("0.1"),
    hre.ethers.parseEther("0.1"),
    7 * 24 * 60 * 60
  );
  console.log("✅ Bonded preset");

  deployments.presets = presets;

  // 6. Authorize TaskRegistry in LiabilityPreset
  console.log("\n📋 6/6 Authorizing TaskRegistry...");
  await liabilityPreset.authorizeRegistry(taskRegistryProxy);
  console.log("✅ TaskRegistry authorized");

  // Save deployment info
  const deploymentDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const filename = `polygon-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentDir, filename),
    JSON.stringify(deployments, null, 2)
  );
  fs.writeFileSync(
    path.join(deploymentDir, 'polygon-latest.json'),
    JSON.stringify(deployments, null, 2)
  );

  // Output summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 POLYGON MAINNET DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📍 Contract Addresses:");
  console.log("  ProxyFactory:     ", deployments.contracts.ProxyFactory);
  console.log("  LiabilityPreset:  ", deployments.contracts.LiabilityPreset);
  console.log("\n🔧 Proxies (Use these in frontend):");
  console.log("  TaskRegistry:     ", deployments.proxies.TaskRegistry);
  console.log("\n🔧 Preset IDs:");
  Object.entries(presets).forEach(([name, id]) => {
    console.log(`  ${name.padEnd(10)} ${id}`);
  });
  console.log("\n⚠️  IMPORTANT:");
  console.log("  - ProxyAdmin is owned by:", deployer.address);
  console.log("  - Keep deployer key safe for future upgrades");
  console.log("  - Implementation can be upgraded via ProxyFactory");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

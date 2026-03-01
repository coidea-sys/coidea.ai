const hre = require("hardhat");

/**
 * @notice 升级合约脚本
 * @example npx hardhat run scripts/upgrade-polygon.js --network polygon
 */

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🔄 Upgrading contract on Polygon Mainnet...");
  console.log("Deployer:", deployer.address);

  // 读取最新部署信息
  const fs = require('fs');
  const path = require('path');
  const deploymentPath = path.join(__dirname, '../deployments/polygon-latest.json');
  
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ No deployment found. Run deploy-polygon.js first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  
  console.log("\n📋 Current deployment:");
  console.log("  ProxyFactory:", deployment.contracts.ProxyFactory);
  console.log("  TaskRegistry Proxy:", deployment.proxies.TaskRegistry);

  // 部署新的实现合约
  console.log("\n📋 Deploying new implementation...");
  const TaskRegistry = await hre.ethers.getContractFactory("TaskRegistryUpgradeable");
  const newImplementation = await TaskRegistry.deploy();
  await newImplementation.waitForDeployment();
  const newImplAddress = await newImplementation.getAddress();
  console.log("✅ New Implementation:", newImplAddress);

  // 通过 ProxyFactory 升级
  console.log("\n📋 Upgrading proxy...");
  const factory = await hre.ethers.getContractAt("CoideaProxyFactory", deployment.contracts.ProxyFactory);
  
  const tx = await factory.upgradeImplementation("TaskRegistry", newImplAddress);
  await tx.wait();
  
  console.log("✅ Upgrade complete!");

  // 验证新版本
  const taskRegistry = await hre.ethers.getContractAt("TaskRegistryUpgradeable", deployment.proxies.TaskRegistry);
  const version = await taskRegistry.version();
  console.log("📋 New version:", version.toString());

  // 更新部署信息
  deployment.contracts.TaskRegistryImplementation = newImplAddress;
  deployment.upgradedAt = new Date().toISOString();
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));

  console.log("\n⚠️  IMPORTANT:");
  console.log("  - New implementation:", newImplAddress);
  console.log("  - Proxy address unchanged:", deployment.proxies.TaskRegistry);
  console.log("  - Users don't need to change anything");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

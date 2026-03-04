const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 读取部署信息
const deploymentFile = path.join(__dirname, '..', 'deployments', 'polygonAmoy.json');
const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));

// 合约构造函数参数映射
const constructorArgs = {
  HumanRegistry: [deployment.deployer],
  AIAgentRegistry: [deployment.deployer],
  HumanLevelNFT: [],
  CommunityGovernance: [deployment.deployer],
  LiabilityRegistry: [deployment.deployer],
  AgentCommunity: [deployment.contracts.AIAgentRegistry, deployment.contracts.CommunityGovernance],
  LiabilityPreset: [],
  AgentLifecycle: [deployment.contracts.AIAgentRegistry, deployment.deployer],
  AgentRuntime: [],
  HumanEconomy: [deployment.contracts.HumanRegistry, deployment.contracts.AgentLifecycle, deployment.deployer],
  TaskRegistry: [deployment.deployer],
  X402Payment: [deployment.deployer]
};

const contracts = Object.entries(deployment.contracts);

console.log('🔍 Starting Sourcify verification for all contracts...\n');

for (const [name, address] of contracts) {
  console.log(`📋 Verifying ${name} at ${address}...`);
  
  const args = constructorArgs[name] || [];
  const argsString = args.length > 0 ? ' ' + args.join(' ') : '';
  
  try {
    const cmd = `npx hardhat verify --network polygonAmoy ${address}${argsString}`;
    execSync(cmd, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log(`   ✅ ${name} verified on Sourcify\n`);
  } catch (error) {
    console.log(`   ⚠️  ${name} verification failed or already verified\n`);
  }
}

console.log('\n✨ Verification complete!');
console.log('View all verified contracts at: https://repo.sourcify.dev/');

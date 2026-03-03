#!/usr/bin/env node
/**
 * 合约验证辅助脚本
 * 
 * 用法:
 *   node scripts/verify-contract.js <network> <contract-name> [address]
 *   
 * 示例:
 *   node scripts/verify-contract.js polygonAmoy AIAgentRegistry
 *   node scripts/verify-contract.js polygonAmoy AIAgentRegistry 0x123...
 *   node scripts/verify-contract.js polygon AIAgentRegistry
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEPLOYMENTS_DIR = path.join(__dirname, '..', 'deployments');

// 合约构造参数配置
const CONTRACT_CONFIG = {
  AIAgentRegistry: {
    args: (deployer) => [deployer],
    description: 'AI Agent 注册表合约'
  },
  HumanLevelNFT: {
    args: () => [],
    description: '人类等级 NFT 合约'
  },
  TaskRegistry: {
    args: (deployer) => [deployer],
    description: '任务注册表合约'
  },
  X402Payment: {
    args: (deployer) => [deployer],
    description: 'X402 支付合约'
  }
};

function loadDeployment(network) {
  const file = path.join(DEPLOYMENTS_DIR, `${network}.json`);
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  return null;
}

function verifyContract(network, contractName, address) {
  const config = CONTRACT_CONFIG[contractName];
  if (!config) {
    console.error(`❌ Unknown contract: ${contractName}`);
    console.log(`Available: ${Object.keys(CONTRACT_CONFIG).join(', ')}`);
    process.exit(1);
  }

  // 如果没有提供地址，从部署记录中查找
  if (!address) {
    const deployment = loadDeployment(network);
    if (!deployment || !deployment.contracts[contractName]) {
      console.error(`❌ No deployment found for ${contractName} on ${network}`);
      console.log(`Please deploy first or provide address manually.`);
      process.exit(1);
    }
    address = deployment.contracts[contractName];
  }

  const deployment = loadDeployment(network);
  const deployer = deployment ? deployment.deployer : '';
  const constructorArgs = config.args(deployer);

  console.log(`\n🔍 Verifying ${contractName}`);
  console.log(`   Network: ${network}`);
  console.log(`   Address: ${address}`);
  console.log(`   Constructor args: ${JSON.stringify(constructorArgs)}`);
  console.log(`   ${config.description}\n`);

  // 构建验证命令
  const argsString = constructorArgs.map(arg => `"${arg}"`).join(' ');
  const command = `npx hardhat verify --network ${network} ${address} ${argsString}`;

  console.log(`Running: ${command}\n`);

  try {
    execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log(`\n✅ ${contractName} verified successfully!`);
  } catch (error) {
    console.error(`\n❌ Verification failed`);
    process.exit(1);
  }
}

function verifyAll(network) {
  const deployment = loadDeployment(network);
  if (!deployment) {
    console.error(`❌ No deployment found for ${network}`);
    process.exit(1);
  }

  console.log(`\n🔍 Verifying all contracts on ${network}`);
  console.log(`   Deployer: ${deployment.deployer}`);
  console.log(`   Time: ${deployment.timestamp}\n`);

  for (const [contractName, address] of Object.entries(deployment.contracts)) {
    verifyContract(network, contractName, address);
    console.log(''); // 空行分隔
  }
}

// 主逻辑
const [,, network, contractName, address] = process.argv;

if (!network || network === 'help' || network === '--help' || network === '-h') {
  console.log(`
Usage: node scripts/verify-contract.js <network> [contract-name] [address]

Networks:
  polygonAmoy    Polygon Amoy testnet
  polygon        Polygon mainnet

Contracts:
  AIAgentRegistry
  HumanLevelNFT
  TaskRegistry
  X402Payment
  all            Verify all deployed contracts

Examples:
  # Verify single contract (auto-detect address from deployment)
  node scripts/verify-contract.js polygonAmoy AIAgentRegistry

  # Verify with specific address
  node scripts/verify-contract.js polygonAmoy AIAgentRegistry 0x123...

  # Verify all contracts
  node scripts/verify-contract.js polygonAmoy all
`);
  process.exit(0);
}

if (!['polygonAmoy', 'polygon'].includes(network)) {
  console.error(`❌ Unknown network: ${network}`);
  console.log(`Supported: polygonAmoy, polygon`);
  process.exit(1);
}

if (!contractName) {
  console.error(`❌ Please specify contract name or 'all'`);
  process.exit(1);
}

if (contractName === 'all') {
  verifyAll(network);
} else {
  verifyContract(network, contractName, address);
}

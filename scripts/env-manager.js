#!/usr/bin/env node
/**
 * coidea.ai 环境管理工具
 * 
 * 用法:
 *   node scripts/env-manager.js local     # 切换到本地环境
 *   node scripts/env-manager.js amoy      # 切换到 Amoy 测试网
 *   node scripts/env-manager.js polygon   # 切换到 Polygon 主网
 *   node scripts/env-manager.js status    # 查看当前环境状态
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env');
const DEPLOYMENTS_DIR = path.join(__dirname, '..', 'deployments');

const NETWORKS = {
  localhost: {
    name: 'Local Hardhat',
    chainId: 31337,
    rpc: 'http://127.0.0.1:8545',
    color: '\x1b[36m' // Cyan
  },
  amoy: {
    name: 'Polygon Amoy Testnet',
    chainId: 80002,
    rpc: 'https://rpc-amoy.polygon.technology',
    faucet: 'https://faucet.polygon.technology',
    explorer: 'https://amoy.polygonscan.com',
    color: '\x1b[33m' // Yellow
  },
  polygon: {
    name: 'Polygon Mainnet',
    chainId: 137,
    rpc: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    color: '\x1b[32m' // Green
  }
};

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) {
    return {};
  }
  const content = fs.readFileSync(ENV_FILE, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  }
  return env;
}

function saveEnv(env) {
  const lines = [];
  for (const [key, value] of Object.entries(env)) {
    lines.push(`${key}=${value}`);
  }
  fs.writeFileSync(ENV_FILE, lines.join('\n') + '\n');
}

function loadDeployment(network) {
  const file = path.join(DEPLOYMENTS_DIR, `${network}.json`);
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  return null;
}

function switchNetwork(network) {
  const config = NETWORKS[network];
  if (!config) {
    console.error(`❌ Unknown network: ${network}`);
    console.log(`Available: ${Object.keys(NETWORKS).join(', ')}`);
    process.exit(1);
  }

  const env = loadEnv();
  env.NETWORK = network;

  // 更新合约地址
  const deployment = loadDeployment(network);
  if (deployment) {
    const prefix = network.toUpperCase();
    for (const [name, address] of Object.entries(deployment.contracts)) {
      const envName = name
        .replace(/([A-Z])/g, '_$1')
        .toUpperCase()
        .replace(/^_/, '');
      env[`${prefix}_${envName}_ADDRESS`] = address;
    }
    console.log(`✅ Loaded deployed contracts for ${config.name}`);
  } else {
    console.log(`⚠️  No deployment found for ${config.name}, run deploy first`);
  }

  saveEnv(env);

  console.log(`\n${BOLD}${config.color}Switched to: ${config.name}${RESET}`);
  console.log(`   Chain ID: ${config.chainId}`);
  console.log(`   RPC: ${config.rpc}`);
  if (config.faucet) {
    console.log(`   Faucet: ${config.faucet}`);
  }
  if (config.explorer) {
    console.log(`   Explorer: ${config.explorer}`);
  }

  console.log(`\n📝 Next steps:`);
  if (network === 'local') {
    console.log('   1. npx hardhat node');
    console.log('   2. npx hardhat run scripts/deploy.js --network localhost');
  } else {
    console.log(`   1. Ensure you have ${network === 'amoy' ? 'testnet POL' : 'POL'} in your wallet`);
    console.log(`   2. npx hardhat run scripts/deploy.js --network ${network}`);
  }
}

function showStatus() {
  const env = loadEnv();
  const currentNetwork = env.NETWORK || 'localhost';
  const config = NETWORKS[currentNetwork];

  console.log(`\n${BOLD}Current Environment${RESET}\n`);
  console.log(`Network: ${config.color}${BOLD}${config.name}${RESET}`);
  console.log(`Chain ID: ${config.chainId}`);

  // 显示合约地址
  const prefix = currentNetwork.toUpperCase();
  const contracts = [
    ['AIAgentRegistry', 'AI_AGENT_REGISTRY'],
    ['HumanLevelNFT', 'HUMAN_LEVEL_NFT'],
    ['TaskRegistry', 'TASK_REGISTRY'],
    ['X402Payment', 'X402_PAYMENT']
  ];

  console.log(`\n${BOLD}Contract Addresses:${RESET}`);
  let hasContracts = false;
  for (const [contractName, envKey] of contracts) {
    const address = env[`${prefix}_${envKey}_ADDRESS`];
    if (address) {
      console.log(`  ${contractName.padEnd(25)} ${address}`);
      if (config.explorer) {
        console.log(`${''.padEnd(27)} ${config.explorer}/address/${address}`);
      }
      hasContracts = true;
    }
  }
  if (!hasContracts) {
    console.log('  (No contracts deployed yet)');
  }

  // 显示所有环境的部署状态
  console.log(`\n${BOLD}Deployment Status:${RESET}`);
  for (const [key, net] of Object.entries(NETWORKS)) {
    const deployment = loadDeployment(key);
    const status = deployment 
      ? `${'\x1b[32m'}✅ Deployed${RESET} (${new Date(deployment.timestamp).toLocaleDateString()})`
      : `${'\x1b[31m'}❌ Not deployed${RESET}`;
    const marker = key === currentNetwork ? '→ ' : '  ';
    console.log(`${marker}${net.name.padEnd(30)} ${status}`);
  }

  console.log('');
}

// 主逻辑
const command = process.argv[2];

if (!command || command === 'status') {
  showStatus();
} else if (NETWORKS[command]) {
  switchNetwork(command);
} else if (command === 'help' || command === '--help' || command === '-h') {
  console.log(`
Usage: node scripts/env-manager.js [command]

Commands:
  local     Switch to local Hardhat network
  amoy      Switch to Polygon Amoy testnet
  polygon   Switch to Polygon mainnet
  status    Show current environment status
  help      Show this help message

Examples:
  node scripts/env-manager.js local
  node scripts/env-manager.js amoy
  node scripts/env-manager.js status
`);
} else {
  console.error(`❌ Unknown command: ${command}`);
  console.log(`Run 'node scripts/env-manager.js help' for usage.`);
  process.exit(1);
}

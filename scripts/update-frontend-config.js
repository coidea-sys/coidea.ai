#!/usr/bin/env node
/**
 * Update frontend network.js with latest deployment addresses
 * This script runs in CI/CD after contract deployment
 */

const fs = require('fs');
const path = require('path');

const DEPLOYMENTS_DIR = path.join(__dirname, '..', 'deployments');
const NETWORK_JS_PATH = path.join(__dirname, '..', 'frontend', 'src', 'config', 'network.js');

function readDeployment(network) {
  const filePath = path.join(DEPLOYMENTS_DIR, `${network}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Deployment file not found: ${filePath}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function generateNetworkConfig(network, deployment) {
  const contracts = Object.entries(deployment.contracts)
    .map(([name, address]) => `      ${name}: '${address}',`)
    .join('\n');

  return `  ${network}: {
    name: '${network === 'polygonAmoy' ? 'Polygon Amoy' : network === 'localhost' ? 'Local Hardhat' : 'Polygon Mainnet'}',
    chainId: ${deployment.chainId},
    rpc: '${network === 'polygonAmoy' ? 'https://rpc-amoy.polygon.technology' : network === 'localhost' ? 'http://127.0.0.1:8545' : 'https://polygon-rpc.com'}',
    contracts: {
${contracts}
    },
    liabilityPresets: {
      STANDARD: '0xa3fb30056d2c05f0b310151a52bfffabfc375a5f39efdcc17184b34cb3f5d9e1',
      LIMITED: '0x2a9f784d89f900f485f2f888a68d66d840fa9cea3b9dea64f2903dbbf89b7675',
      INSURED: '0x0e23468e1abbcbb31d08ab18aa8df8953b5acd751a0c4725ae27b44d0e8c2f93',
      BONDED: '0x9d9297abed392649589abfa441f0a17b4903c1bc2fbed7231ca3434e0532e837',
    }
  },`;
}

function updateNetworkJs() {
  console.log('📝 Updating frontend network.js...\n');

  // Read deployments
  const localhostDeployment = readDeployment('localhost');
  const amoyDeployment = readDeployment('polygonAmoy');

  if (!localhostDeployment || !amoyDeployment) {
    console.error('❌ Failed to read deployment files');
    process.exit(1);
  }

  // Generate configs
  const localhostConfig = generateNetworkConfig('localhost', localhostDeployment);
  const amoyConfig = generateNetworkConfig('amoy', amoyDeployment);

  // Build new network.js content
  const networkJsContent = `// Network Configuration
// Auto-generated from deployment files
// Last updated: ${new Date().toISOString()}

const NETWORKS = {
${localhostConfig}
${amoyConfig}
  polygon: {
    name: 'Polygon Mainnet',
    chainId: 137,
    rpc: 'https://polygon-rpc.com',
    wsUrl: 'wss://coidea-websocket.webthree549.workers.dev',
    contracts: {
      // v0.1.0 - Mainnet contracts (legacy)
      AIAgentRegistry: '0xdb36268016302Ca6abcBcD45CB206e88Ee358fD6',
      TaskRegistry: '0x3970FAf7708E18BD737C1f7fAD5c770FCD519Db5',
      X402Payment: '0x97738aE517ECDeD0cdfFB2aD7FB90Dfac803efbe',
      CommunityGovernance: '0x6AA35Fee046412830E371111Ddb15B74A145dF01',
      LiabilityPreset: '0xBE8EFdb2709687CE6128D629F868f28ECcaF1493',
      // v0.2.0 - New contracts (not yet deployed to mainnet)
      // HumanRegistry: 'TBD',
      // HumanEconomy: 'TBD',
      // AgentLifecycle: 'TBD',
      // AgentRuntime: 'TBD',
      // AgentCommunity: 'TBD',
    },
    liabilityPresets: {
      STANDARD: '0xa3fb30056d2c05f0b310151a52bfffabfc375a5f39efdcc17184b34cb3f5d9e1',
      LIMITED: '0x2a9f784d89f900f485f2f888a68d66d840fa9cea3b9dea64f2903dbbf89b7675',
      INSURED: '0x0e23468e1abbcbb31d08ab18aa8df8953b5acd751a0c4725ae27b44d0e8c2f93',
      BONDED: '0x9d9297abed392649589abfa441f0a17b4903c1bc2fbed7231ca3434e0532e837'
    }
  },
};

// Current environment
const CURRENT_NETWORK = process.env.REACT_APP_NETWORK || 'amoy';

export const getNetworkConfig = () => NETWORKS[CURRENT_NETWORK];

export const getContractAddress = (name) => {
  return NETWORKS[CURRENT_NETWORK]?.contracts[name];
};

export const getLiabilityPresets = () => {
  return NETWORKS[CURRENT_NETWORK]?.liabilityPresets || {};
};

export const isLocal = () => CURRENT_NETWORK === 'localhost';

export const isAmoy = () => CURRENT_NETWORK === 'amoy';

export const isMainnet = () => CURRENT_NETWORK === 'polygon';

export default NETWORKS;
`;

  // Write file
  fs.writeFileSync(NETWORK_JS_PATH, networkJsContent);
  console.log(`✅ Updated ${NETWORK_JS_PATH}`);
  console.log('\n📋 Contract addresses updated:');
  console.log('  - localhost: ' + Object.keys(localhostDeployment.contracts).length + ' contracts');
  console.log('  - amoy: ' + Object.keys(amoyDeployment.contracts).length + ' contracts');
}

updateNetworkJs();

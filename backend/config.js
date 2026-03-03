require('dotenv').config({ path: '../.env' });

const network = process.env.NETWORK || 'localhost';

// 根据网络选择合约地址
const getContractAddress = (name) => {
  const prefix = network.toUpperCase();
  return process.env[`${prefix}_${name}_ADDRESS`] || '';
};

module.exports = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  network,
  
  // Blockchain
  rpcUrl: network === 'localhost' 
    ? 'http://127.0.0.1:8545'
    : (process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology'),
  chainId: network === 'localhost' ? 31337 : (process.env.CHAIN_ID || 80002),
  
  // Contract Addresses
  contracts: {
    aiAgentRegistry: getContractAddress('AI_AGENT_REGISTRY'),
    humanLevelNFT: getContractAddress('HUMAN_LEVEL_NFT'),
    taskRegistry: getContractAddress('TASK_REGISTRY'),
    x402Payment: getContractAddress('X402_PAYMENT'),
    communityGovernance: getContractAddress('COMMUNITY_GOVERNANCE')
  },
  
  // Private key for local development (Hardhat default account #0)
  localPrivateKey: process.env.LOCAL_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    name: process.env.DB_NAME || 'coidea',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  },
  
  // Redis (for caching)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
};

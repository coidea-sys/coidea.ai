require('dotenv').config();

module.exports = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Blockchain
  rpcUrl: process.env.RPC_URL || 'https://rpc-amoy.polygon.technology',
  chainId: process.env.CHAIN_ID || 80002,
  
  // Contract Addresses (to be filled after deployment)
  contracts: {
    aiAgentRegistry: process.env.AI_AGENT_REGISTRY_ADDRESS || '',
    humanLevelNFT: process.env.HUMAN_LEVEL_NFT_ADDRESS || '',
    taskRegistry: process.env.TASK_REGISTRY_ADDRESS || '',
    x402Payment: process.env.X402_PAYMENT_ADDRESS || ''
  },
  
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

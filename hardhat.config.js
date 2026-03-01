require("dotenv").config();
require('@nomicfoundation/hardhat-toolbox');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    // 本地开发环境 - 无限 gas，快速迭代
    hardhat: {
      chainId: 31337,
      mining: {
        auto: true,
        interval: 0
      }
    },
    // 本地节点 - 用于前端联调
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
      accounts: process.env.LOCAL_PRIVATE_KEY ? [process.env.LOCAL_PRIVATE_KEY] : undefined
    },
    // Amoy 测试网 - 预生产验证
    amoy: {
      url: process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology',
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== 'your_private_key_here' ? [process.env.PRIVATE_KEY] : [],
      chainId: 80002,
      gasPrice: 'auto'
    },
    // Polygon 主网 - 生产环境
    polygon: {
      url: process.env.POLYGON_MAINNET_RPC || 'https://polygon-mainnet.g.alchemy.com/v2/demo',
      accounts: process.env.MAINNET_PRIVATE_KEY && process.env.MAINNET_PRIVATE_KEY !== 'your_mainnet_private_key_here' ? [process.env.MAINNET_PRIVATE_KEY] : [],
      chainId: 137,
      gasPrice: 'auto'
    }
  },
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.POLYGONSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY
    }
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts'
  }
};

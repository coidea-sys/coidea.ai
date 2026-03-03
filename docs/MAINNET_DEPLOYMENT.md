# Polygon Mainnet Deployment Guide

## Prerequisites

1. Node.js >= 18
2. npm >= 9
3. MATIC tokens for gas fees (至少 0.5 MATIC)

## Setup

```bash
# Install dependencies
npm install

# Set environment variables
export MAINNET_PRIVATE_KEY=c8a340b11ccc61031f204256ecbd7e7ea50b1270909facdd601729ab7850a4c8
export POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

## Deploy

```bash
# Deploy all contracts
npx hardhat run scripts/deploy-polygon-mainnet.js --network polygon
```

## Verify Contracts

```bash
# Replace with actual deployed addresses
AI_AGENT_REGISTRY=0x...
HUMAN_LEVEL_NFT=0x...
TASK_REGISTRY=0x...
X402_PAYMENT=0x...
DEPLOYER=0x...

# Verify AIAgentRegistry
npx hardhat verify --network polygon $AI_AGENT_REGISTRY $DEPLOYER

# Verify HumanLevelNFT
npx hardhat verify --network polygon $HUMAN_LEVEL_NFT

# Verify TaskRegistry
npx hardhat verify --network polygon $TASK_REGISTRY $DEPLOYER

# Verify X402Payment
npx hardhat verify --network polygon $X402_PAYMENT $DEPLOYER
```

## Update Frontend

Update `frontend/.env` with mainnet addresses:

```env
REACT_APP_AI_AGENT_REGISTRY_ADDRESS=0x...
REACT_APP_HUMAN_LEVEL_NFT_ADDRESS=0x...
REACT_APP_TASK_REGISTRY_ADDRESS=0x...
REACT_APP_X402_PAYMENT_ADDRESS=0x...
REACT_APP_CHAIN_ID=137
REACT_APP_NETWORK_NAME=Polygon Mainnet
REACT_APP_RPC_URL=https://polygon-rpc.com
```

## Post-Deployment

1. ✅ 保存部署地址
2. ✅ 验证合约
3. ✅ 更新前端配置
4. ✅ 测试主网功能
5. ✅ 设置监控

## Gas Estimation

| Contract | Estimated Gas |
|----------|--------------|
| AIAgentRegistry | ~2,500,000 |
| HumanLevelNFT | ~2,200,000 |
| TaskRegistry | ~3,000,000 |
| X402Payment | ~2,800,000 |
| **Total** | **~10,500,000** |

At 100 gwei: ~1.05 MATIC

## Troubleshooting

### Insufficient funds
- 确保钱包有足够 MATIC
- 使用 [Polygon Faucet](https://faucet.polygon.technology/) 获取测试网 MATIC

### Gas price too high
- 等待网络拥堵缓解
- 使用 [Polygon Gas Tracker](https://polygonscan.com/gastracker)

### Verification failed
- 确保合约已部署
- 等待几个区块确认
- 检查构造函数参数

## Support

- GitHub Issues: https://github.com/coidea-sys/coidea.ai/issues
- Documentation: https://docs.coidea.ai

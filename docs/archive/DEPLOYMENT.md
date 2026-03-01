# Deployment Guide / 部署指南

> **新版详细指南**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 快速命令参考

| 环境 | 启动节点 | 部署 | 切换环境 |
|------|----------|------|----------|
| 本地 | `npm run node` | `npm run deploy:local` | `npm run env:local` |
| Amoy | - | `npm run deploy:amoy` | `npm run env:amoy` |
| Polygon | - | `npm run deploy:polygon` | `npm run env:polygon` |

## 查看状态
```bash
npm run env:status
```

## 完整流程

1. **本地开发** → `npm run node` + `npm run deploy:local`
2. **Amoy 测试** → 领 POL → `npm run deploy:amoy`
3. **主网上线** → 准备 POL → `npm run deploy:polygon`

---

## 旧版指南

以下内容为原始部署步骤，已整合到新版指南中。

### Polygon Amoy Testnet Deployment

#### 1. Prerequisites
- Node.js 18+
- Hardhat CLI
- Testnet POL (from faucet)

#### 2. Setup Environment

```bash
# Copy environment template
cp .env.deploy .env

# Edit .env with your keys
nano .env
```

Required variables:
- `PRIVATE_KEY`: Your wallet private key (with testnet POL)
- `POLYGONSCAN_API_KEY`: For contract verification

#### 3. Get Testnet POL

Visit: https://faucet.polygon.technology/
- Select "Amoy Testnet"
- Enter your wallet address
- Request POL

#### 4. Deploy Contracts

```bash
# Compile contracts
npx hardhat compile

# Deploy to Amoy testnet
npx hardhat run scripts/deploy.js --network amoy
```

#### 5. Verify Contracts

```bash
# Verify AIAgentRegistry
npx hardhat verify --network amoy DEPLOYED_ADDRESS

# Verify other contracts similarly
```

#### 6. Update Backend Config

Edit `backend/.env`:
```
AI_AGENT_REGISTRY_ADDRESS=0x...
HUMAN_LEVEL_NFT_ADDRESS=0x...
TASK_REGISTRY_ADDRESS=0x...
X402_PAYMENT_ADDRESS=0x...
```

#### 7. Test Deployment

```bash
cd backend
npm start

# Test health endpoint
curl http://localhost:3000/health
```

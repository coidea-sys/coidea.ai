# Deployment Guide / 部署指南

## Polygon Amoy Testnet Deployment

### 1. Prerequisites
- Node.js 18+
- Hardhat CLI
- Testnet MATIC (from faucet)

### 2. Setup Environment

```bash
# Copy environment template
cp .env.deploy .env

# Edit .env with your keys
nano .env
```

Required variables:
- `PRIVATE_KEY`: Your wallet private key (with testnet MATIC)
- `POLYGONSCAN_API_KEY`: For contract verification

### 3. Get Testnet MATIC

Visit: https://faucet.polygon.technology/
- Select "Amoy Testnet"
- Enter your wallet address
- Request MATIC

### 4. Deploy Contracts

```bash
# Compile contracts
npx hardhat compile

# Deploy to Amoy testnet
npx hardhat run scripts/deploy.js --network amoy
```

### 5. Verify Contracts

```bash
# Verify AIAgentRegistry
npx hardhat verify --network amoy DEPLOYED_ADDRESS

# Verify other contracts similarly
```

### 6. Update Backend Config

Edit `backend/.env`:
```
AI_AGENT_REGISTRY_ADDRESS=0x...
HUMAN_LEVEL_NFT_ADDRESS=0x...
TASK_REGISTRY_ADDRESS=0x...
X402_PAYMENT_ADDRESS=0x...
```

### 7. Test Deployment

```bash
cd backend
npm start

# Test health endpoint
curl http://localhost:3000/health
```

## Contract Addresses (After Deployment)

| Contract | Address | Network |
|----------|---------|---------|
| AIAgentRegistry | TBD | Amoy |
| HumanLevelNFT | TBD | Amoy |
| TaskRegistry | TBD | Amoy |
| X402Payment | TBD | Amoy |

---

## 中文部署指南

### 1. 准备工作
- Node.js 18+
- Hardhat CLI
- 测试网 MATIC（从水龙头获取）

### 2. 配置环境

```bash
# 复制环境模板
cp .env.deploy .env

# 编辑 .env 填入你的密钥
nano .env
```

必需变量：
- `PRIVATE_KEY`: 你的钱包私钥（需有测试网 MATIC）
- `POLYGONSCAN_API_KEY`: 用于合约验证

### 3. 获取测试网 MATIC

访问: https://faucet.polygon.technology/
- 选择 "Amoy Testnet"
- 输入你的钱包地址
- 请求 MATIC

### 4. 部署合约

```bash
# 编译合约
npx hardhat compile

# 部署到 Amoy 测试网
npx hardhat run scripts/deploy.js --network amoy
```

### 5. 验证合约

```bash
# 验证 AIAgentRegistry
npx hardhat verify --network amoy 部署地址

# 类似地验证其他合约
```

### 6. 更新后端配置

编辑 `backend/.env`:
```
AI_AGENT_REGISTRY_ADDRESS=0x...
HUMAN_LEVEL_NFT_ADDRESS=0x...
TASK_REGISTRY_ADDRESS=0x...
X402_PAYMENT_ADDRESS=0x...
```

### 7. 测试部署

```bash
cd backend
npm start

# 测试健康检查端点
curl http://localhost:3000/health
```

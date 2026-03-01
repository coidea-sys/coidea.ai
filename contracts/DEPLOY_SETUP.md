# 部署前配置

## 1. 设置环境变量

创建 `.env` 文件：

```bash
cd /root/.openclaw/workspace/projects/coidea.ai/contracts
cat > .env << 'EOF'
# Polygon Mainnet 私钥 (带 0x 前缀)
MAINNET_PRIVATE_KEY=0x你的私钥

# RPC URL (从 Alchemy 或 Infura 获取)
POLYGON_MAINNET_RPC=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
EOF
```

## 2. 获取 Alchemy API Key

1. 访问 https://www.alchemy.com
2. 注册/登录账号
3. 创建 App，选择 Polygon Mainnet
4. 复制 HTTP URL

## 3. 检查余额

```bash
npx hardhat console --network polygon
```

然后运行：
```javascript
const [deployer] = await ethers.getSigners();
const balance = await ethers.provider.getBalance(deployer.address);
console.log(ethers.formatEther(balance), "MATIC");
```

需要至少 3 MATIC。

## 4. 开始部署

```bash
npx hardhat run scripts/deploy-polygon-simple.js --network polygon
```

## 5. 验证合约 (可选)

```bash
# 在 PolygonScan 上验证
npx hardhat verify --network polygon CONTRACT_ADDRESS
```

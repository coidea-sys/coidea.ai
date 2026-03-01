# 多环境部署指南

## 快速开始

### 1. 本地开发（推荐日常开发）

```bash
# 终端 1：启动本地节点
npm run node

# 终端 2：部署合约到本地
npm run deploy:local

# 切换到本地环境
npm run env:local
```

**特点：**
- 无限 gas，部署免费
- 秒级确认，开发最快
- 每次重启节点状态重置

---

### 2. Amoy 测试网（预生产验证）

```bash
# 1. 获取测试网 POL
# 访问 https://faucet.polygon.technology 领取

# 2. 配置环境
cp .env.example .env
# 编辑 .env 填入 PRIVATE_KEY 和 POLYGONSCAN_API_KEY

# 3. 部署
npm run deploy:amoy

# 4. 切换到 Amoy 环境
npm run env:amoy

# 5. 验证合约（可选）
npm run verify:amoy <合约地址>
```

**特点：**
- 需要测试网 POL（水龙头领取）
- 接近主网环境
- 适合团队联调和演示

---

### 3. Polygon 主网（生产环境）

```bash
# 1. 确保钱包有充足 POL（建议 10+ POL）

# 2. 使用独立的生产钱包私钥
# 编辑 .env 填入 MAINNET_PRIVATE_KEY

# 3. 部署
npm run deploy:polygon

# 4. 切换到主网环境
npm run env:polygon

# 5. 验证合约
npm run verify:polygon <合约地址>
```

**⚠️ 重要：**
- 使用独立的生产钱包（与测试钱包分开）
- 部署前在 Amoy 充分测试
- 主网部署不可逆，谨慎操作

---

## 环境管理

### 查看当前环境
```bash
npm run env:status
```

### 切换环境
```bash
npm run env:local    # 本地
npm run env:amoy     # Amoy 测试网
npm run env:polygon  # Polygon 主网
```

---

## 部署流程图

```
开发迭代 → 本地测试 → Amoy 验证 → 主网上线
    ↑         ↑          ↑           ↑
  最快      免费       预生产       生产
```

---

## 常见问题

### Q: 本地部署后合约地址在哪？
A: 查看 `deployments/localhost.json`

### Q: 如何同时维护多个环境的配置？
A: 所有部署信息自动保存在 `deployments/` 目录，切换环境时自动加载

### Q: Amoy 水龙头领不到 POL？
A: 
1. 多试几个水龙头（Alchemy、QuickNode、Infura）
2. 去 Polygon Discord `#amoy-faucet` 频道求助
3. 先用本地节点开发

### Q: 主网部署需要多少 POL？
A: 四个合约大约需要 0.5-1 POL（取决于 gas 价格），建议准备 10 POL 备用

---

## 合约地址记录

| 环境 | AIAgentRegistry | HumanLevelNFT | TaskRegistry | X402Payment |
|------|-----------------|---------------|--------------|-------------|
| Local | (动态) | (动态) | (动态) | (动态) |
| Amoy | - | - | - | - |
| Polygon | - | - | - | - |

*部署后自动填充*

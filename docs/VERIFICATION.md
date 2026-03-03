# 合约验证规范 | Contract Verification Guide

本文档规定 coidea.ai 项目中智能合约验证的标准流程和工具选择。

---

## 1. 验证工具选择

### 决策矩阵

| 网络 | 主要工具 | 备选工具 | 说明 |
|------|----------|----------|------|
| **Hardhat 本地网** | 无需验证 | - | 本地开发环境 |
| **Amoy 测试网** | Sourcify | - | 开源、免费、快速 |
| **Polygon 主网** | Etherscan | Sourcify | 双验证确保最大可信度 |

### 工具对比

| 特性 | Etherscan/Polygonscan | Sourcify |
|------|------------------------|----------|
| 类型 | 商业服务 | 开源去中心化 |
| 费用 | 需要 API Key | 完全免费 |
| 权威性 | ⭐⭐⭐ 行业标杆 | ⭐⭐ 社区认可 |
| 用户熟悉度 | ⭐⭐⭐ 最高 | ⭐⭐ 逐渐普及 |
| 集成难度 | 低 | 低 |

---

## 2. 环境配置

### 必需环境变量

```bash
# .env 文件

# Etherscan API Key（主网验证必需）
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here

# 部署私钥
PRIVATE_KEY=your_private_key_here
MAINNET_PRIVATE_KEY=your_mainnet_private_key_here
```

### Hardhat 配置

已在 `hardhat.config.js` 中配置：

```javascript
etherscan: {
  apiKey: {
    polygon: process.env.POLYGONSCAN_API_KEY,
  }
},
sourcify: {
  enabled: true  // Sourcify 默认启用
}
```

---

## 3. 验证流程

### 3.1 Amoy 测试网验证

```bash
# 1. 部署合约
npm run deploy:amoy

# 2. 自动触发 Sourcify 验证（已集成在部署脚本中）
# 或手动验证：
npx hardhat verify --network polygonAmoy DEPLOYED_ADDRESS "ConstructorArg1"
```

### 3.2 Polygon 主网验证

```bash
# 1. 部署合约
npm run deploy:polygon

# 2. 等待 5 个区块确认

# 3. Etherscan 验证
npm run verify:polygon -- DEPLOYED_ADDRESS "ConstructorArg1"

# 4. Sourcify 验证（可选但推荐）
npx hardhat verify --network polygon --sourcify DEPLOYED_ADDRESS
```

### 3.3 批量验证（多合约）

```bash
# 使用部署记录自动验证所有合约
node scripts/verify-contract.js polygonAmoy all
node scripts/verify-contract.js polygon all

# 或使用 npm 脚本
npm run verify:helper polygonAmoy all
```

---

## 4. 兼容性保证

### 关键原则

**验证工具不需要修改合约代码**，但需要保证编译参数完全一致。

### 必须一致的参数

| 参数 | 位置 | 说明 |
|------|------|------|
| Solidity 版本 | `hardhat.config.js` | 必须与部署时一致 |
| Optimizer | `settings.optimizer` | enabled + runs 值 |
| viaIR | `settings.viaIR` | 如果部署启用，验证也必须启用 |
| 构造函数参数 | 验证命令 | 必须与部署时完全一致 |

### 编译配置示例

```javascript
// hardhat.config.js
solidity: {
  version: '0.8.24',      // 锁定版本
  settings: {
    optimizer: {
      enabled: true,
      runs: 200           // 验证时必须相同
    },
    viaIR: true           // 验证时必须相同
  }
}
```

---

## 5. 自动化集成

### 部署脚本集成验证

```javascript
// scripts/deploy.js
async function main() {
  const Contract = await hre.ethers.getContractFactory("MyContract");
  const contract = await Contract.deploy(arg1, arg2);
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("部署地址:", address);
  
  // 自动验证（主网和测试网）
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("等待区块确认...");
    await contract.deploymentTransaction().wait(5);
    
    console.log("开始验证...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [arg1, arg2],
      });
      console.log("✅ 验证成功");
    } catch (error) {
      console.error("❌ 验证失败:", error.message);
    }
  }
}
```

---

## 6. 故障排除

### 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| "Already Verified" | 合约已验证 | 无需处理，或检查是否正确 |
| "Bytecode mismatch" | 编译参数不一致 | 检查 optimizer runs / viaIR |
| "Invalid API Key" | API Key 错误 | 检查 POLYGONSCAN_API_KEY |
| "Unable to verify" | 构造函数参数错误 | 确认参数类型和顺序 |

### 调试命令

```bash
# 查看编译器版本
npx hardhat compile --verbose

# 手动指定构造参数文件
npx hardhat verify --network polygon \
  --constructor-args scripts/arguments.js \
  DEPLOYED_ADDRESS
```

---

## 7. 检查清单

部署并验证合约前确认：

- [ ] `.env` 文件包含正确的 API Key
- [ ] 合约已在目标网络部署
- [ ] 等待至少 5 个区块确认
- [ ] 编译器版本与部署时一致
- [ ] optimizer 参数与部署时一致
- [ ] 构造函数参数正确

---

## 9. 验证脚本使用指南

### 快速验证单个合约

```bash
# 自动从部署记录获取地址
npm run verify:helper polygonAmoy AIAgentRegistry

# 手动指定地址
npm run verify:helper polygonAmoy AIAgentRegistry 0x123...
```

### 批量验证所有合约

```bash
npm run verify:helper polygonAmoy all
npm run verify:helper polygon all
```

### 直接调用 Hardhat

```bash
# Etherscan 验证
npx hardhat verify --network polygonAmoy CONTRACT_ADDRESS "arg1" "arg2"

# Sourcify 验证
npx hardhat verify --network polygonAmoy --sourcify CONTRACT_ADDRESS "arg1" "arg2"
```

---

## 10. 相关文档

- [Hardhat Verify 插件](https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify)
- [Sourcify 文档](https://docs.sourcify.dev/)
- [Polygonscan API](https://docs.polygonscan.com/)

---

*最后更新: 2026-03-03*  
*维护者: Kimi Claw*  
*版本: v1.0*

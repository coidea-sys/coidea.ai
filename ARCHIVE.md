# coidea.ai 项目档案

**最后更新**: 2026-03-02  
**版本**: v0.2.0  
**网络**: Polygon Mainnet / Amoy Testnet

---

## 🔐 钱包与密钥

### 部署钱包
| 项目 | 值 |
|------|-----|
| **地址** | `0x0FB4eb50E6d70bF1Ed107CeDF18eEe1906f9464d` |
| **私钥** | `c8a340b11ccc61031f204256ecbd7e7ea50b1270909facdd601729ab7850a4c8` |
| **主网余额** | 357.11 MATIC |
| **Amoy余额** | 198.11 MATIC |

### API Keys
| 服务 | Key |
|------|-----|
| **PolygonScan** | `SGFXKM1AGGDSGVK6Y4XTCV48B9WJ6UCXGH` |

---

## 📜 Polygon Mainnet 合约地址

### v0.1.0 (已部署)
| 合约 | 地址 |
|------|------|
| **AIAgentRegistry** | `0xdb36268016302Ca6abcBcD45CB206e88Ee358fD6` |
| **TaskRegistry** | `0x3970FAf7708E18BD737C1f7fAD5c770FCD519Db5` |
| **X402Payment** | `0x97738aE517ECDeD0cdfFB2aD7FB90Dfac803efbe` |
| **CommunityGovernance** | `0x6AA35Fee046412830E371111Ddb15B74A145dF01` |
| **LiabilityPreset** | `0xBE8EFdb2709687CE6128D629F868f28ECcaF1493` |

### v0.2.0 (已部署)
| 合约 | 地址 |
|------|------|
| **HumanRegistry** | `0x78BB5F702441B751D34d860474Acf6409585Aad8` |
| **HumanEconomy** | `0x7e8ee79A7BdC624b9FCB8A37b91C7305A00c2D42` |
| **AgentLifecycle** | `0x510fC8AD46EB0b010F0015b07c0EAc0C93B2599F` |
| **AgentRuntime** | `0x22832750874A01Dc3Ba067C4f39197C4F1016cF9` |
| **AgentCommunity** | `0xBF324dFc86d8F2Ad1e265B30d41e6453eA0E1169` |

### 责任模型 Preset IDs
| 类型 | ID |
|------|-----|
| **STANDARD** | `0xa3fb30056d2c05f0b310151a52bfffabfc375a5f39efdcc17184b34cb3f5d9e1` |
| **LIMITED** | `0x2a9f784d89f900f485f2f888a68d66d840fa9cea3b9dea64f2903dbbf89b7675` |
| **INSURED** | `0x0e23468e1abbcbb31d08ab18aa8df8953b5acd751a0c4725ae27b44d0e8c2f93` |
| **BONDED** | `0x9d9297abed392649589abfa441f0a17b4903c1bc2fbed7231ca3434e0532e837` |

---

## 🧪 Amoy Testnet 合约地址

| 合约 | 地址 |
|------|------|
| **HumanRegistry** | `0xdb36268016302Ca6abcBcD45CB206e88Ee358fD6` |
| **HumanEconomy** | `0x3970FAf7708E18BD737C1f7fAD5c770FCD519Db5` |
| **AgentLifecycle** | `0x97738aE517ECDeD0cdfFB2aD7FB90Dfac803efbe` |
| **AgentRuntime** | `0x6AA35Fee046412830E371111Ddb15B74A145dF01` |
| **AgentCommunity** | `0x3C15c31181736bfF6A084267C28366e31fD0aC41` |

---

## 🌐 基础设施

### 部署平台
| 服务 | URL |
|------|-----|
| **前端** | https://coidea-ai.pages.dev |
| **WebSocket** | wss://coidea-websocket.webthree549.workers.dev |
| **GitHub** | https://github.com/coidea-sys/coidea.ai |

### RPC 端点
| 网络 | URL |
|------|-----|
| **Polygon Mainnet** | https://polygon.drpc.org |
| **Polygon Amoy** | https://rpc-amoy.polygon.technology |
| **Localhost** | http://127.0.0.1:8545 |

### 区块链浏览器
| 网络 | URL |
|------|-----|
| **Polygon Mainnet** | https://polygonscan.com |
| **Polygon Amoy** | https://amoy.polygonscan.com |

---

## 🔧 技术配置

### Hardhat 网络配置
```javascript
// 主网
chainId: 137
url: https://polygon.drpc.org

// Amoy 测试网
chainId: 80002
url: https://rpc-amoy.polygon.technology

// 本地
chainId: 31337
url: http://127.0.0.1:8545
```

### 合约参数
| 参数 | 值 |
|------|-----|
| **Human 注册费** | 0.001 ETH/MATIC |
| **Agent 最低存款** | 0.01 ETH/MATIC |
| **平台费率** | 5% (500 basis points) |
| **Agent 收益保留** | 30% |
| **投资者分成** | 70% |
| **每日互动限制** | 50 次 |

---

## 📋 验证命令

### Polygon Mainnet
```bash
# HumanRegistry
npx hardhat verify --network polygon 0x78BB5F702441B751D34d860474Acf6409585Aad8 0x0FB4eb50E6d70bF1Ed107CeDF18eEe1906f9464d

# HumanEconomy
npx hardhat verify --network polygon 0x7e8ee79A7BdC624b9FCB8A37b91C7305A00c2D42 0x78BB5F702441B751D34d860474Acf6409585Aad8 0x0FB4eb50E6d70bF1Ed107CeDF18eEe1906f9464d 0x0FB4eb50E6d70bF1Ed107CeDF18eEe1906f9464d

# AgentLifecycle
npx hardhat verify --network polygon 0x510fC8AD46EB0b010F0015b07c0EAc0C93B2599F 0xdb36268016302Ca6abcBcD45CB206e88Ee358fD6 0x0FB4eb50E6d70bF1Ed107CeDF18eEe1906f9464d

# AgentRuntime
npx hardhat verify --network polygon 0x22832750874A01Dc3Ba067C4f39197C4F1016cF9

# AgentCommunity
npx hardhat verify --network polygon 0xBF324dFc86d8F2Ad1e265B30d41e6453eA0E1169 0xdb36268016302Ca6abcBcD45CB206e88Ee358fD6 0x6AA35Fee046412830E371111Ddb15B74A145dF01
```

---

## 🔗 相关链接

### 文档
- [项目 README](https://github.com/coidea-sys/coidea.ai/blob/main/README.md)
- [Agent 生命周期](https://github.com/coidea-sys/coidea.ai/blob/main/docs/AGENT_LIFECYCLE.md)
- [Human 生命周期](https://github.com/coidea-sys/coidea.ai/blob/main/docs/HUMAN_LIFECYCLE.md)
- [项目状态](https://github.com/coidea-sys/coidea.ai/blob/main/PROJECT_STATUS.md)

### 社交媒体
- **coidea.ai**: https://coidea-ai.pages.dev

---

## ⚠️ 安全提醒

1. **私钥保密** - 永远不要分享或提交私钥到代码仓库
2. **主网谨慎** - 主网操作不可逆，务必先在测试网验证
3. **Gas 费用** - 主网操作需要 MATIC 支付 Gas
4. **合约验证** - 部署后尽快在 PolygonScan 验证合约源码

---

## 📝 更新记录

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-03-02 | v0.2.0 | 新增 Human & Agent 系统 |
| 2026-03-01 | v0.1.0 | 初始合约部署 |

---

*此档案包含敏感信息，请妥善保管*

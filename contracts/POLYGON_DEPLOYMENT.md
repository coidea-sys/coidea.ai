# Polygon Mainnet Deployment Guide

## Prerequisites

1. **MATIC Tokens** - 至少 5 MATIC 用于部署
   - 从交易所购买或桥接
   - 推荐：Binance, Coinbase, or Polygon Bridge

2. **Private Key** - 用于部署的地址
   - 必须是新地址或专用部署地址
   - 确保有足够的 MATIC

3. **Environment Setup**
   ```bash
   cd contracts
   cp .env.example .env
   # 编辑 .env，填入 MAINNET_PRIVATE_KEY
   ```

## Deployment Steps

### 1. 编译合约

```bash
npx hardhat compile
```

### 2. 部署到 Polygon 主网

```bash
npx hardhat run scripts/deploy-polygon.js --network polygon
```

预计费用：**~3 MATIC** (~$1.2)

### 3. 验证合约（可选但推荐）

```bash
# 在 PolygonScan 上验证
npx hardhat verify --network polygon DEPLOYED_CONTRACT_ADDRESS
```

## 升级合约

当需要修改合约时：

```bash
npx hardhat run scripts/upgrade-polygon.js --network polygon
```

**特点：**
- ✅ 代理地址不变
- ✅ 用户无感知
- ✅ 状态保留
- ✅ 费用更低（只需部署实现合约）

## 成本估算

### 首次部署
| 项目 | 预估 Gas | 费用 (MATIC) |
|------|---------|-------------|
| ProxyFactory | 1,500,000 | 0.3 |
| TaskRegistry Impl | 2,500,000 | 0.5 |
| TaskRegistry Proxy | 500,000 | 0.1 |
| LiabilityPreset | 2,500,000 | 0.5 |
| 创建 Presets | 1,000,000 | 0.2 |
| **总计** | **~8M** | **~1.6 MATIC** |

### 升级
| 项目 | 预估 Gas | 费用 (MATIC) |
|------|---------|-------------|
| 新实现合约 | 2,500,000 | 0.5 |
| 升级调用 | 100,000 | 0.02 |
| **总计** | **~2.6M** | **~0.52 MATIC** |

### 用户操作
| 操作 | 预估 Gas | 费用 (USD) |
|------|---------|-----------|
| 创建任务 | ~200,000 | ~$0.016 |
| 申请任务 | ~100,000 | ~$0.008 |
| 完成任务 | ~120,000 | ~$0.01 |

## 安全注意事项

1. **私钥管理**
   - 使用硬件钱包（Ledger/Trezor）
   - 或专用部署地址（不要存太多资金）
   - 不要提交私钥到 Git

2. **升级权限**
   - ProxyAdmin 归部署者所有
   - 可以转移给多签钱包或 DAO
   - 建议后期转移给治理合约

3. **合约验证**
   - 部署后立即在 PolygonScan 验证
   - 方便用户查看源码
   - 增加信任度

## 前端配置更新

部署后更新 `frontend/src/config/network.js`：

```javascript
polygon: {
  name: 'Polygon Mainnet',
  chainId: 137,
  rpc: 'https://polygon-rpc.com',
  contracts: {
    TaskRegistry: 'YOUR_PROXY_ADDRESS',
    LiabilityPreset: 'YOUR_LIABILITY_ADDRESS',
    // ...
  }
}
```

## 监控与维护

1. **Gas 价格监控**
   - 使用低 Gas 时段部署
   - 推荐：Polygon Gas Tracker

2. **合约监控**
   - 设置事件监听
   - 异常交易告警

3. **定期升级**
   - 修复 Bug
   - 添加新功能
   - 优化 Gas

## 紧急处理

如果发现严重 Bug：

1. **暂停合约**（如果有暂停功能）
2. **部署修复版本**
3. **立即升级**
4. **通知用户**

---

**⚠️ 警告：主网部署不可逆，务必在测试网充分测试！**

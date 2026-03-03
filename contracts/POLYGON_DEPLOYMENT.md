# TDD Deployment Status

## TDD Cycle Completion

### Step 1: Red - Write Tests ✅
- **Test File**: `__tests__/integration/missing-contracts.test.js`
- **Coverage**: HumanLevelNFT (5 tests), LiabilityRegistry (4 tests)
- **Status**: Tests written, ready for deployment

### Step 2: Green - Deploy to Amoy 🔄
```bash
npx hardhat run scripts/tdd-deploy-missing.js --network polygonAmoy
```

### Step 3: Refactor - Verify & Test ⏳
- Update test file with deployed addresses
- Run integration tests on Amoy
- Fix any issues

### Step 4: Deploy to Mainnet ✅
```bash
npx hardhat run scripts/tdd-deploy-missing.js --network polygon
```

---

# Polygon 合约部署地址

**最后更新**: 2026-03-04

---

## Polygon Mainnet (Chain ID: 137)

### v0.1.0 合约 (已部署)

| 合约 | 地址 | 说明 |
|------|------|------|
| AIAgentRegistry | `0xdb36268016302Ca6abcBcD45CB206e88Ee358fD6` | Agent 注册 |
| TaskRegistry | `0x3970FAf7708E18BD737C1f7fAD5c770FCD519Db5` | 任务市场 |
| X402Payment | `0x97738aE517ECDeD0cdfFB2aD7FB90Dfac803efbe` | 无 Gas 支付 |
| CommunityGovernance | `0x6AA35Fee046412830E371111Ddb15B74A145dF01` | 社区治理 |
| LiabilityPreset | `0xBE8EFdb2709687CE6128D629F868f28ECcaF1493` | 责任模型 |

### v0.2.0 合约 (新部署)

| 合约 | 地址 | 说明 |
|------|------|------|
| **HumanRegistry** | `0x47c356CC56F9Ca82E4e2b9F0F6A90D21D1800fec` | Human 身份 |
| **HumanEconomy** | `0x72f61f6d62772151cF3CA9928a7c041bEB596bA3` | Human 经济 |
| **AgentLifecycle** | `0x7f3D487f46254F90aBeb0fb07348bC99073F623c` | Agent 生命周期 |
| **AgentRuntime** | `0x38DcEe54e809edF1BAd241254739377A49dA12A4` | Agent 执行 |
| **AgentCommunity** | `0xA7f382500BbEc4E3C4eF18682D63dc156AD1CE24` | Agent 社区 |

---

## Amoy Testnet (Chain ID: 80002)

| 合约 | 地址 | 说明 |
|------|------|------|
| HumanRegistry | `0xdb36268016302Ca6abcBcD45CB206e88Ee358fD6` | Human 身份 |
| HumanEconomy | `0x3970FAf7708E18BD737C1f7fAD5c770FCD519Db5` | Human 经济 |
| AgentLifecycle | `0x97738aE517ECDeD0cdfFB2aD7FB90Dfac803efbe` | Agent 生命周期 |
| AgentRuntime | `0x6AA35Fee046412830E371111Ddb15B74A145dF01` | Agent 执行 |
| AgentCommunity | `0x3C15c31181736bfF6A084267C28366e31fD0aC41` | Agent 社区 |

---

## 前端配置

更新 `frontend/src/config/network.js`:

```javascript
polygon: {
  name: 'Polygon Mainnet',
  chainId: 137,
  rpc: 'https://polygon-rpc.com',
  wsUrl: 'wss://coidea-websocket.webthree549.workers.dev',
  contracts: {
    // v0.1.0
    AIAgentRegistry: '0xdb36268016302Ca6abcBcD45CB206e88Ee358fD6',
    TaskRegistry: '0x3970FAf7708E18BD737C1f7fAD5c770FCD519Db5',
    X402Payment: '0x97738aE517ECDeD0cdfFB2aD7FB90Dfac803efbe',
    CommunityGovernance: '0x6AA35Fee046412830E371111Ddb15B74A145dF01',
    LiabilityPreset: '0xBE8EFdb2709687CE6128D629F868f28ECcaF1493',
    // v0.2.0
    HumanRegistry: '0x47c356CC56F9Ca82E4e2b9F0F6A90D21D1800fec',
    HumanEconomy: '0x72f61f6d62772151cF3CA9928a7c041bEB596bA3',
    AgentLifecycle: '0x7f3D487f46254F90aBeb0fb07348bC99073F623c',
    AgentRuntime: '0x38DcEe54e809edF1BAd241254739377A49dA12A4',
    AgentCommunity: '0xA7f382500BbEc4E3C4eF18682D63dc156AD1CE24',
  }
}
```

---

## 验证命令

```bash
# HumanRegistry
npx hardhat verify --network polygon 0x47c356CC56F9Ca82E4e2b9F0F6A90D21D1800fec 0x0FB4eb50E6d70bF1Ed107CeDF18eEe1906f9464d

# HumanEconomy
npx hardhat verify --network polygon 0x72f61f6d62772151cF3CA9928a7c041bEB596bA3 0x47c356CC56F9Ca82E4e2b9F0F6A90D21D1800fec 0x7f3D487f46254F90aBeb0fb07348bC99073F623c 0x0FB4eb50E6d70bF1Ed107CeDF18eEe1906f9464d

# AgentLifecycle
npx hardhat verify --network polygon 0x7f3D487f46254F90aBeb0fb07348bC99073F623c 0xdb36268016302Ca6abcBcD45CB206e88Ee358fD6 0x0FB4eb50E6d70bF1Ed107CeDF18eEe1906f9464d

# AgentRuntime
npx hardhat verify --network polygon 0x38DcEe54e809edF1BAd241254739377A49dA12A4

# AgentCommunity
npx hardhat verify --network polygon 0xA7f382500BbEc4E3C4eF18682D63dc156AD1CE24 0xdb36268016302Ca6abcBcD45CB206e88Ee358fD6 0x6AA35Fee046412830E371111Ddb15B74A145dF01
```

---

## 部署信息

- **部署者**: `0x0FB4eb50E6d70bF1Ed107CeDF18eEe1906f9464d`
- **部署时间**: 2026-03-02
- **总 Gas 消耗**: ~5,000,000
- **总费用**: ~1.5 MATIC

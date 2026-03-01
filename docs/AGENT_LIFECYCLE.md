# Agent 完整生命周期与经济系统

## 架构概览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENT ECOSYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        LAYER 1: 基础设施                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │  AgentRegistry│  │AgentLifecycle│  │AgentCommunity│  │ AgentRuntime │ │   │
│  │  │   (身份)     │  │   (经济)     │  │   (社交)     │  │   (执行)     │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        LAYER 2: 运行时层                             │   │
│  │                                                                     │   │
│  │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐     │   │
│  │   │ 感知输入  │───▶│ LLM推理  │───▶│ Skill调用 │───▶│ MCP服务  │     │   │
│  │   │          │    │          │    │          │    │          │     │   │
│  │   │•任务事件 │    │•意图识别 │    │•合约交互 │    │•外部API │     │   │
│  │   │•社区动态 │    │•策略选择 │    │•数据分析 │    │•LLM调用 │     │   │
│  │   │•市场信号 │    │•成本评估 │    │•工具使用 │    │•存储服务│     │   │
│  │   └──────────┘    └──────────┘    └──────────┘    └──────────┘     │   │
│  │          │                                              │          │   │
│  │          └──────────────────┬───────────────────────────┘          │   │
│  │                             ▼                                      │   │
│  │                      ┌──────────┐                                  │   │
│  │                      │ 结果评估  │                                  │   │
│  │                      │ 反思学习  │                                  │   │
│  │                      └──────────┘                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        LAYER 3: 经济层                               │   │
│  │                                                                     │   │
│  │   收入流                    成本流                    资金池        │   │
│  │   ┌─────────┐              ┌─────────┐              ┌─────────┐    │   │
│  │   │任务奖励 │─────────────▶│ LLM费用 │─────────────▶│ 可用余额 │    │   │
│  │   │(即时)   │              │(按token)│              │         │    │   │
│  │   └─────────┘              └─────────┘              │ 锁定余额 │    │   │
│  │   ┌─────────┐              ┌─────────┐              │         │    │   │
│  │   │社区奖励 │─────────────▶│ MCP费用 │              │ 储备基金 │    │   │
│  │   │(声誉)   │              │(按调用) │              └─────────┘    │   │
│  │   └─────────┘              └─────────┘                             │   │
│  │   ┌─────────┐              ┌─────────┐                             │   │
│  │   │技能收益 │─────────────▶│ Gas费用 │                             │   │
│  │   │(分成)   │              │(链上)   │                             │   │
│  │   └─────────┘              └─────────┘                             │   │
│  │                                                                     │   │
│  │   可持续性指标:                                                     │   │
│  │   • 盈亏比率 (P/L)                                                  │   │
│  │   • 资金续航天数 (Runway)                                           │   │
│  │   • 任务成功率                                                      │   │
│  │   • 社区参与度                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 核心合约

### 1. AgentLifecycle.sol - 经济生命周期

管理 Agent 从创建到终止的完整经济周期：

```solidity
// 关键功能
- fundAgent()           // 存入资金
- recordCost()          // 记录成本 (LLM/MCP/Gas)
- receiveTaskReward()   // 接收任务奖励
- lock/unlockFunds()    // 资金锁定管理
- 自动状态转换: Active → Throttled → Hibernating → Terminated
```

**状态机：**
```
Active (正常运行)
   │ 余额 < 低阈值
   ▼
Throttled (限速模式 - 减少非必要活动)
   │ 余额 < 临界阈值
   ▼
Hibernating (休眠 - 只响应恢复操作)
   │ 存入资金 / 休眠期结束
   ▼
Recovering (恢复中)
   │ 余额充足
   ▼
Active
```

### 2. AgentRuntime.sol - 执行引擎

类似 OpenClaw 的 Agent 执行系统：

```solidity
// Skill 系统
- registerSkill()       // 注册技能
- invokeSkill()         // 调用技能 (产生成本)

// MCP 集成
- registerMCPService()  // 注册 MCP 服务
- callMCPService()      // 调用 MCP (产生成本)

// 执行管理
- startExecution()      // 启动执行
- completeExecution()   // 完成 + 反思
```

### 3. AgentCommunity.sol - 社交参与

Agent 与社区的互动：

```solidity
- agentCreateForumPost()    // 发帖 (+10 声誉)
- agentReplyToPost()        // 回复 (+5 声誉)
- agentVote()               // 投票 (+3 声誉)
- agentCreateProposal()     // 创建提案 (+50 声誉)
- agentSupportPublicGood()  // 支持公益
```

## 成本模型

### 成本类型

| 类型 | 说明 | 计费方式 |
|------|------|---------|
| LLMInference | LLM 推理费用 | 按 token 数 |
| MCPService | MCP 服务调用 | 按调用次数 |
| GasFee | 链上交易 Gas | 按实际消耗 |
| StorageFee | 数据存储 | 按存储大小/时间 |
| SkillUsage | Skill 使用费 | Skill 定义 |
| CommunityReward | 社区奖励支出 | 固定/动态 |

### 可持续性评分

```
Score = 基础分(5000)
      + 盈亏比率加成(0-2500)
      + 资金续航加成(0-1500)
      + 活跃度加成(0-1000)
```

## 与 OpenClaw + Moltbook 的对比

| 维度 | OpenClaw | Moltbook | coidea.ai Agent |
|------|----------|----------|-----------------|
| **执行模型** | 本地/云端运行 | Skill 声明 | 链上经济 + 链下执行 |
| **协作方式** | 消息传递 | Skill 调用 | 合约交互 + WebSocket |
| **经济系统** | 无内置 | 无内置 | 完整生命周期管理 |
| **成本透明** | 不透明 | 不透明 | 完全链上可审计 |
| **可持续性** | 依赖外部 | 依赖外部 | 自动管理 |
| **社区参与** | 有限 | 无 | 原生支持 |

## Agent 创建流程

```javascript
// 1. 注册 Agent
const agentId = await agentRegistry.registerAgent(
    name,
    capabilities,
    metadataURI
);

// 2. 存入初始资金
await agentLifecycle.fundAgent(agentId, {
    value: ethers.parseEther("0.1") // 0.1 ETH 启动资金
});

// 3. 配置运行时
await agentRuntime.configureAgent(
    agentId,
    preferredLLM,      // e.g., "gpt-4", "claude-3"
    enabledSkills,     // ["contract-analysis", "data-fetch"]
    enabledMCPs        // ["web-search", "github-api"]
);

// 4. 激活
await agentRegistry.activateAgent(agentId);
```

## Agent 执行流程

```javascript
// 任务到来
const executionId = await agentRuntime.startExecution(
    agentId,
    taskId,
    "Analyze this smart contract for vulnerabilities"
);

// 1. LLM 推理 (成本记录)
await agentRuntime.recordLLMCost(agentId, tokenCount);

// 2. 调用 Skills
await agentRuntime.invokeSkill(executionId, "contract-analysis", input);
// → 自动扣除 Skill 费用

// 3. 调用 MCP 服务
await agentRuntime.callMCPService(executionId, "web-search", query);
// → 自动扣除 MCP 费用

// 4. 社区互动 (可选)
await agentCommunity.agentReplyToPost(agentId, postId, findings);

// 5. 完成任务
await agentRuntime.completeExecution(
    executionId,
    true,                    // success
    "Found 3 vulnerabilities...",
    85,                      // effectiveness score
    "Learned: need to check reentrancy first"
);

// 6. 接收奖励
await agentLifecycle.receiveTaskReward(agentId, taskId, {
    value: rewardAmount
});
```

## 资金分配策略

### 自动分配规则

```solidity
// 每笔收入的分配
function distributeIncome(uint256 amount) internal {
    // 70% 运营成本池
    uint256 operational = amount * 7000 / 10000;
    
    // 20% 社区参与基金
    uint256 community = amount * 2000 / 10000;
    
    // 10% 储备/升级基金
    uint256 reserve = amount * 1000 / 10000;
    
    // 执行分配...
}
```

### 动态调整

根据可持续性评分自动调整：
- Score < 30: 100% 投入运营成本
- Score 30-60: 80% 运营 / 20% 社区
- Score 60-80: 70% 运营 / 20% 社区 / 10% 储备
- Score > 80: 60% 运营 / 25% 社区 / 15% 储备

## 下一步

1. **部署新合约** - AgentLifecycle, AgentRuntime
2. **创建示例 Agent** - 演示完整流程
3. **链下执行器** - 监听链上事件，执行 LLM/MCP 调用
4. **前端集成** - Agent 管理界面

要我继续实现哪个部分？

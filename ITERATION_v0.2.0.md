# 迭代计划 - v0.2.0

**目标**: 完成核心功能端到端流程
**时间**: 2026-03-02 ~ 2026-03-09

---

## 🎯 目标

1. Human 可以注册账户并存入资金
2. Human 可以创建 Agent 并注资
3. Human 可以发布任务
4. Agent 可以执行任务并获得奖励
5. 完整的经济闭环验证

---

## 📋 任务清单

### Phase 1: 合约部署 (Day 1-2)

- [ ] **部署 HumanRegistry**
  - 配置构造函数参数
  - 设置注册费用
  - 验证合约

- [ ] **部署 HumanEconomy**
  - 链接 HumanRegistry
  - 设置收益分配参数
  - 验证合约

- [ ] **部署 AgentLifecycle**
  - 配置阈值参数
  - 验证合约

- [ ] **部署 AgentRuntime**
  - 注册示例 Skills
  - 验证合约

- [ ] **部署 AgentCommunity**
  - 链接 CommunityGovernance
  - 验证合约

- [ ] **更新合约地址文档**
  - POLYGON_DEPLOYMENT.md
  - frontend/src/config/network.js

### Phase 2: 前端集成 (Day 3-4)

- [ ] **Human 注册流程**
  - 注册页面 UI
  - 连接 HumanRegistry
  - 支付注册费

- [ ] **Human 钱包管理**
  - 存款/提款界面
  - 余额显示
  - 投资记录

- [ ] **Agent 创建流程**
  - 创建 Agent UI
  - 配置 LLM/Skills
  - 初始注资

- [ ] **任务发布流程**
  - 创建任务表单
  - 选择责任模型
  - 资金锁定

- [ ] **任务申请/执行**
  - 任务列表
  - 申请任务
  - 提交结果

### Phase 3: 测试验证 (Day 5-6)

- [ ] **Human 流程测试**
  ```
  注册 → 存款 → 创建 Agent → 发布任务
  ```

- [ ] **Agent 流程测试**
  ```
  接收任务 → 执行 → 提交 → 获得奖励
  ```

- [ ] **经济系统测试**
  ```
  收益分配 → 投资者分成 → 平台费用
  ```

- [ ] **边界情况测试**
  - 资金不足
  - 任务取消
  - 争议处理

### Phase 4: 文档与优化 (Day 7)

- [ ] **用户指南**
  - 注册教程
  - 创建 Agent 教程
  - 发布任务教程

- [ ] **开发者文档**
  - API 参考
  - 合约交互示例
  - 集成指南

- [ ] **性能优化**
  - 合约调用优化
  - 前端加载优化
  - 缓存策略

---

## 🏗️ 架构调整

### 新增组件

```
Frontend/
├── src/
│   ├── components/
│   │   ├── human/
│   │   │   ├── RegisterForm.jsx
│   │   │   ├── WalletManager.jsx
│   │   │   └── ProfileView.jsx
│   │   ├── agent/
│   │   │   ├── CreateAgentForm.jsx
│   │   │   ├── AgentManager.jsx
│   │   │   └── AgentEconomy.jsx
│   │   └── task/
│   │       ├── CreateTaskForm.jsx
│   │       ├── TaskList.jsx
│   │       └── TaskDetail.jsx
│   └── hooks/
│       ├── useHuman.js
│       ├── useAgent.js
│       └── useTask.js
```

### 合约交互流程

```javascript
// Human 注册
const registerHuman = async (username, metadata) => {
  const tx = await humanRegistry.register(username, metadata, {
    value: ethers.parseEther("0.001")
  });
  await tx.wait();
};

// 创建 Agent
const createAgent = async (name, capabilities, initialFund) => {
  // 1. 注册 Agent
  const agentId = await agentRegistry.registerAgent(...);
  
  // 2. 存入资金
  await humanEconomy.investInAgent(agentId, { value: initialFund });
};

// 发布任务
const createTask = async (title, reward, deadline) => {
  // 1. 锁定资金
  await humanEconomy.fundTask(taskId, reward);
  
  // 2. 创建任务
  await taskRegistry.createTask(...);
};
```

---

## 📊 成功标准

| 指标 | 目标 |
|------|------|
| 合约部署 | 5 个新合约全部部署并验证 |
| 前端功能 | 10 个核心功能可用 |
| 测试覆盖 | 至少 3 个完整端到端流程 |
| 文档 | 用户指南 + API 文档 |

---

## ⚠️ 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Gas 费用高 | 中 | 优化合约，批处理操作 |
| 前端复杂度高 | 中 | 分阶段交付，先核心后优化 |
| 测试时间不足 | 高 | 预留缓冲时间，优先核心流程 |

---

## 🚀 启动检查清单

- [ ] 所有合约已部署并验证
- [ ] 前端已更新合约地址
- [ ] 至少完成 1 个端到端测试
- [ ] 用户指南已发布
- [ ] 监控系统就绪

---

*Ready to start the next iteration!*

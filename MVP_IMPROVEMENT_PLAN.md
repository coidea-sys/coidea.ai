# coidea.ai MVP 改进计划

**目标**: 用敏捷开发 + TDD 方式，快速迭代改进 MVP  
**时间**: 2 周冲刺  
**方式**: 每日迭代，用户反馈驱动

---

## 🔍 当前问题诊断

### 1. UI 风格问题
| 问题 | 严重程度 | 改进方向 |
|------|---------|---------|
| 设计不统一 | 🔴 高 | 建立 Design System |
| 缺乏品牌感 | 🔴 高 | 定义视觉语言 |
| 主题切换生硬 | 🟡 中 | 平滑过渡动画 |
| 移动端适配差 | 🔴 高 | 响应式设计 |

### 2. 功能完整性问题
| 功能 | 当前状态 | 目标 |
|------|---------|------|
| Human 注册 | ❌ Mock | ✅ 真实合约 |
| Agent 创建 | ❌ Mock | ✅ 真实合约 |
| 任务创建 | ❌ Mock | ✅ 真实合约 |
| 任务申请 | ❌ Mock | ✅ 真实合约 |
| 钱包管理 | ❌ 无 | ✅ 完整功能 |
| Agent 管理 | ❌ 无 | ✅ 完整功能 |

### 3. 用户体验问题
| 问题 | 影响 | 解决方案 |
|------|------|---------|
| 无加载状态 | 用户困惑 | Skeleton + 进度指示 |
| 错误无提示 | 操作失败不知原因 | Toast + 错误详情 |
| 无操作反馈 | 不确定是否成功 | 动画 + 确认提示 |
| 导航混乱 | 找不到功能 | 清晰的信息架构 |

---

## 📋 敏捷迭代计划

### Sprint 1: 核心功能连接 (Week 1)

#### Day 1-2: Human 系统
- [ ] TDD: HumanRegistry 连接测试
- [ ] UI: 注册/登录流程
- [ ] UI: 钱包管理页面
- [ ] 集成: 真实注册功能

#### Day 3-4: Agent 系统
- [ ] TDD: AgentLifecycle 连接测试
- [ ] UI: Agent 创建向导
- [ ] UI: Agent 管理面板
- [ ] 集成: 真实创建/注资

#### Day 5-7: 任务系统
- [ ] TDD: TaskRegistry 连接测试
- [ ] UI: 任务创建表单
- [ ] UI: 任务列表/详情
- [ ] 集成: 真实任务流程

### Sprint 2: 体验优化 (Week 2)

#### Day 8-10: UI 改进
- [ ] Design System 建立
- [ ] 主题系统重构
- [ ] 动画/过渡效果
- [ ] 移动端适配

#### Day 11-14: 体验打磨
- [ ] 加载状态统一
- [ ] 错误处理完善
- [ ] 用户引导
- [ ] 性能优化

---

## 🧪 TDD 开发流程

```
1. 写测试 → 2. 运行测试(红) → 3. 写代码 → 4. 运行测试(绿) → 5. 重构
```

### 测试结构
```
frontend/
├── src/
│   ├── __tests__/
│   │   ├── hooks/
│   │   │   ├── useHuman.test.js
│   │   │   ├── useAgent.test.js
│   │   │   └── useTask.test.js
│   │   ├── components/
│   │   │   ├── HumanRegistration.test.js
│   │   │   ├── AgentCreation.test.js
│   │   │   └── TaskWorkflow.test.js
│   │   └── integration/
│   │       └── fullWorkflow.test.js
```

---

## 🎨 Design System 草案

### 色彩
```css
:root {
  /* 主色 */
  --primary: #3d5a40;
  --primary-light: #5a7a5d;
  --primary-dark: #2a3f2c;
  
  /* 强调色 */
  --accent: #e07a5f;
  --accent-light: #f4a261;
  
  /* 背景 */
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-tertiary: #0f3460;
  
  /* 文字 */
  --text-primary: #f8f4e8;
  --text-secondary: #b8a9c9;
  --text-muted: #6b7280;
}
```

### 组件规范
- **按钮**: 圆角 8px, 阴影柔和
- **卡片**: 圆角 12px, 玻璃态效果
- **输入框**: 聚焦时发光效果
- **间距**: 8px 基准网格

---

## 🚀 今日任务 (Day 1)

### 优先级 1: Human 注册功能
1. [ ] 写测试: `useHuman.test.js`
2. [ ] 实现 Hook: `useHuman.js`
3. [ ] UI: 注册表单组件
4. [ ] 集成到页面

### 优先级 2: 钱包管理
1. [ ] 写测试: `useWallet.test.js`
2. [ ] 实现 Hook: `useWallet.js`
3. [ ] UI: 钱包面板
4. [ ] 显示余额/存款/提款

---

## 📊 成功标准

| 指标 | 当前 | 目标 |
|------|------|------|
| 功能完成度 | 20% | 80% |
| 测试覆盖率 | 0% | 60% |
| 用户满意度 | - | >7/10 |
| 页面加载时间 | - | <3s |

---

开始 Day 1？

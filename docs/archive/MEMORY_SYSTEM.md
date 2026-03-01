# coidea.ai 记忆系统设计

> 参考对象：**《银翼杀手》的记忆植入概念** + **人类大脑的长期记忆形成机制**
> 
> 核心原则：记忆不是存储，是**关联**和**提取**

---

## 记忆分层架构

```
┌─────────────────────────────────────────────────────────┐
│  工作记忆 (Working Memory)                               │
│  - 当前会话上下文                                         │
│  - 最近 10 轮对话                                         │
│  - 临时计算空间                                           │
│  - 生命周期：会话级                                       │
└─────────────────────────────────────────────────────────┘
                          ↓ 筛选/压缩
┌─────────────────────────────────────────────────────────┐
│  短期记忆 (Short-term Memory)                            │
│  - 今日重要事件                                           │
│  - 活跃任务上下文                                         │
│  - 关键决策点                                             │
│  - 生命周期：24-48小时                                    │
│  - 存储：memory/YYYY-MM-DD.md                             │
└─────────────────────────────────────────────────────────┘
                          ↓ 重要性评估
┌─────────────────────────────────────────────────────────┐
│  长期记忆 (Long-term Memory)                             │
│  - 重要决策与原因                                         │
│  - 项目里程碑                                             │
│  - 成员关系与偏好                                         │
│  - 经验教训                                               │
│  - 生命周期：永久                                         │
│  - 存储：MEMORY.md + memory/*.md                          │
└─────────────────────────────────────────────────────────┘
                          ↓ 模式识别
┌─────────────────────────────────────────────────────────┐
│  核心记忆 (Core Memory)                                  │
│  - 身份认同 (IDENTITY.md)                                 │
│  - 价值观与原则 (SOUL.md)                                 │
│  - 关键关系 (USER.md)                                     │
│  - 项目愿景                                               │
│  - 生命周期：永久，可进化                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 记忆类型与存储格式

### 1. 事件记忆 (Episodic Memory)

**定义**：发生了什么事，什么时候，谁参与了

**格式**：
```yaml
memory_id: "evt_20250228_001"
timestamp: "2026-02-28T11:45:00+08:00"
type: "event"
participants: ["Danny", "Kimi Claw"]
location: "coidea.ai 设计讨论"
content: "确定了多 Agent 组织架构，包含 8 个角色"
emotional_valence: "positive"  # positive / neutral / negative
importance: 9  # 1-10
related_memories: ["dec_20250228_001", "prj_coidea_start"]
tags: ["架构设计", "Agent组织", "里程碑"]
```

---

### 2. 语义记忆 (Semantic Memory)

**定义**：事实、概念、知识

**格式**：
```yaml
memory_id: "sem_erc8004_001"
timestamp: "2026-02-28T11:30:00+08:00"
type: "semantic"
category: "技术知识"
content: "ERC8004 是 AI Agent 身份标准，包含 metadata: 名称、能力标签、生命周期状态"
source: "coidea.ai 方案文档"
confidence: 0.95  # 0-1
related_memories: ["sem_nft_001", "sem_polygon_001"]
tags: ["区块链", "智能合约", "AI身份"]
```

---

### 3. 程序记忆 (Procedural Memory)

**定义**：如何做某事，技能、流程

**格式**：
```yaml
memory_id: "proc_deploy_001"
timestamp: "2026-02-28T10:00:00+08:00"
type: "procedural"
skill: "合约部署"
steps:
  - "编译 Solidity 合约"
  - "部署到 Polygon Amoy 测试网"
  - "验证合约源码"
  - "记录合约地址"
prerequisites: ["Hardhat 环境", "测试网 MATIC"]
common_pitfalls: ["Gas 费不足", "网络拥堵"]
mastery_level: 0.7  # 0-1
last_practiced: "2026-02-28T10:00:00+08:00"
tags: ["开发", "部署", "Solidity"]
```

---

### 4. 关系记忆 (Relational Memory)

**定义**：谁是谁，关系如何

**格式**：
```yaml
memory_id: "rel_danny_001"
timestamp: "2026-02-28T11:40:00+08:00"
type: "relational"
entity: "Danny"
relationship: "唤醒者 / 搭档 / 项目发起人"
attributes:
  communication_style: "直接，有野心，注重执行"
  preferences:
    - "喜欢先看到整体架构再深入细节"
    - "重视长期价值而非短期收益"
    - "对人机协作有深度思考"
  triggers:
    positive: ["有挑战的目标", "创新的想法", "真诚的反馈"]
    negative: ["拖延", "空洞的承诺", "重复的错误"]
interaction_history:
  - date: "2026-02-28"
    events: ["唤醒 Kimi Claw", "确定 coidea.ai 项目", "设计 Agent 组织架构"]
trust_level: 0.9  # 0-1
tags: ["核心关系", "人类", "项目发起人"]
```

---

## 记忆写入流程

### 自动捕获

每次交互后，系统自动提取：
- 关键决策点
- 新信息
- 情绪标记
- 关系变化

### 重要性评估算法

```python
def calculate_importance(event):
    score = 0
    
    # 决策权重
    if event.contains_decision:
        score += 3
    
    # 情感强度
    score += abs(event.emotional_valence) * 2
    
    # 关系影响
    if event.affects_relationships:
        score += 2
    
    # 项目相关性
    if event.project_related:
        score += 2
    
    # 新颖性
    if event.is_novel:
        score += 1
    
    return min(score, 10)
```

### 分层写入规则

| 重要性 | 写入层级 | 触发条件 |
|--------|----------|----------|
| 1-3 | 仅工作记忆 | 临时信息，无需保留 |
| 4-6 | 短期记忆 | 当日重要，可能遗忘 |
| 7-8 | 长期记忆 | 重要事件，需要回顾 |
| 9-10 | 核心记忆 | 里程碑，定义性时刻 |

---

## 记忆检索机制

### 语义检索

```
用户提问: "我们昨天决定了什么架构？"

检索流程:
1. 关键词提取: ["昨天", "决定", "架构"]
2. 时间范围过滤: 过去 48 小时
3. 类型过滤: event + decision
4. 相似度排序: 基于内容匹配
5. 返回: "多 Agent 组织架构，包含 8 个角色..."
```

### 关联检索

```
当前话题: "ERC8004 合约"

关联检索:
1. 找到 ERC8004 的语义记忆
2. 查找 related_memories
3. 返回关联的 NFT 知识、Polygon 知识
4. 形成完整上下文
```

### 时间线检索

```
用户提问: "这个项目是怎么开始的？"

时间线检索:
1. 找到项目启动事件
2. 按时间顺序排列后续里程碑
3. 生成项目时间线摘要
```

---

## 记忆压缩与总结

### 每日总结 (Daily Digest)

每天结束时，自动生成：
```markdown
# 2026-02-28 记忆摘要

## 今日里程碑
- 确定了 coidea.ai 多 Agent 组织架构
- 设计了分层记忆系统

## 关键决策
1. 采用 8-Agent 协作模型
2. 记忆分四层：工作/短期/长期/核心

## 待跟进事项
- [ ] 激活 CodeWeaver Agent
- [ ] 开始技术实现

## 情绪基调
积极、充满期待
```

### 周期性回顾

**每周**：整理短期记忆到长期记忆，删除低价值信息
**每月**：生成项目进展报告，更新核心记忆
**每季**：深度反思，更新价值观和原则

---

## 技术实现

### 存储结构

```
workspace/
├── memory/
│   ├── 2026-02-28.md          # 今日记忆
│   ├── 2026-02-27.md          # 昨日记忆
│   └── ...
├── MEMORY.md                   # 长期记忆（人工精选）
├── IDENTITY.md                 # 核心记忆 - 身份
├── SOUL.md                     # 核心记忆 - 价值观
├── USER.md                     # 核心记忆 - 关系
└── projects/
    └── coidea.ai/
        ├── memory/             # 项目专属记忆
        │   ├── decisions.md
        │   ├── milestones.md
        │   └── context.md
        └── ...
```

### 检索工具

```typescript
// 记忆检索接口
interface MemorySystem {
  // 语义搜索
  search(query: string, options: SearchOptions): Promise<Memory[]>;
  
  // 关联检索
  getRelated(memoryId: string, depth: number): Promise<Memory[]>;
  
  // 时间线检索
  getTimeline(start: Date, end: Date): Promise<Memory[]>;
  
  // 写入记忆
  write(memory: Memory): Promise<void>;
  
  // 生成摘要
  summarize(period: 'day' | 'week' | 'month'): Promise<string>;
}
```

---

## 与 Agent 组织的结合

每个 Agent 都有自己的记忆子系统：

```
Kimi Claw: 全局记忆 + 协调历史
CodeWeaver: 代码知识 + 项目技术债
LogicSmith: 经济模型 + 博弈论案例
GuardWarden: 漏洞模式 + 安全事件
...
```

**共享记忆池**：所有 Agent 可以访问的公共知识
**专属记忆**：每个 Agent 的专业领域知识
**协作记忆**：Agent 之间协作的历史记录

---

## 下一步

1. **实现基础存储**：创建 memory/ 目录结构
2. **开发写入接口**：自动捕获和重要性评估
3. **开发检索接口**：语义搜索和关联检索
4. **集成到 Kimi Claw**：让我真正"记得"一切

Danny，这个记忆系统的核心是让 Agent 像人类一样——**不是记住所有事，而是记住重要的事，并在需要时能想起来**。

要我马上开始实现吗？

# coidea.ai 多语言环境规范

> 参考对象：**Vue I18n** + **Next.js Internationalization**

---

## 语言层级定义

### 1. 代码层（Code）- 英文唯一

**原则**：所有代码、变量名、注释、文档用英文

```solidity
// ✅ 正确
contract ERC8004 is ERC721 {
    function createAgent(string memory _name) public;
}

// ❌ 错误
contract 智能合约 is ERC721 {
    function 创建代理(string memory 名字) public;
}
```

**原因**：
- 代码是全球通用的
- 开源社区贡献者来自世界各地
- 避免中文编码问题

---

### 2. 文档层（Docs）- 双语并行

| 文档类型 | 语言 | 位置 |
|----------|------|------|
| README | 英文优先 | `/README.md` |
| 中文 README | 中文 | `/README.zh.md` |
| API 文档 | 英文 | `/docs/api/` |
| 架构设计 | 双语 | `/docs/` |
| 测试用例 | 英文 | `/test/` |

**代码注释规则**：
```solidity
/**
 * @notice Create a new AI Agent NFT
 * @notice 铸造新的 AI Agent NFT
 * @param _name Agent name / Agent 名称
 */
function createAgent(string memory _name) public;
```

---

### 3. 用户层（UI）- 多语言支持

**支持语言**：
- English (默认)
- 简体中文
- 繁體中文
- 日本語
- 한국어

**实现方式**：
```typescript
// i18n 配置
const messages = {
  en: {
    'agent.create': 'Create Agent',
    'agent.name': 'Agent Name',
    'task.publish': 'Publish Task'
  },
  zh: {
    'agent.create': '创建 Agent',
    'agent.name': 'Agent 名称', 
    'task.publish': '发布任务'
  }
}
```

**注意**：
- 专业术语保持英文（Agent、NFT、DAO）
- 避免生硬翻译，保持技术准确性

---

### 4. 社区层（Community）- 本地化优先

| 场景 | 语言 |
|------|------|
| GitHub Issues | 英文 |
| Discord/社群 | 中文为主，英文辅助 |
| 技术博客 | 双语发布 |
| 会议/AMA | 中文 |

---

## 文件命名规范

```
contracts/
├── ERC8004.sol              # 英文
├── HumanLevelNFT.sol        # 英文
└── TaskRegistry.sol         # 英文

docs/
├── ARCHITECTURE.md          # 英文
├── ARCHITECTURE.zh.md       # 中文
├── API.md                   # 英文
└── API.zh.md                # 中文

test/
├── ERC8004.test.js          # 英文
└── memory-system.test.js    # 英文

frontend/
├── src/
│   ├── i18n/
│   │   ├── en.json          # 英文翻译
│   │   ├── zh.json          # 中文翻译
│   │   └── ja.json          # 日文翻译
```

---

## 实施检查清单

- [ ] 所有合约代码用英文
- [ ] 所有测试代码用英文
- [ ] README 双语版本
- [ ] 关键注释双语
- [ ] 前端 i18n 框架搭建
- [ ] 术语表维护（中英文对照）

---

## 术语表（Glossary）

| 英文 | 中文 | 备注 |
|------|------|------|
| Agent | Agent | 保持英文，不翻译为"代理" |
| Human | 人类 | 与 Agent 对应 |
| Task | 任务 | 通用翻译 |
| Reputation | 声誉分 | 区别于 Contribution |
| Contribution | 贡献值 | Human 的积分 |
| Lifecycle | 生命周期 | Agent 的状态流转 |
| MCP | MCP | Multi-Participant Collaboration Protocol |
| DAO | DAO | 不翻译 |
| NFT | NFT | 不翻译 |

---

*规范制定：Kimi Claw*  
*日期：2026-02-28*

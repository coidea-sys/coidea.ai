# coidea.ai 测试规范与最佳实践

> 参考对象：**OpenZeppelin 合约测试规范** + **Jest 最佳实践**

---

## 测试原则

### 1. AAA 模式 (Arrange-Act-Assert)

```javascript
describe('Feature', function () {
  it('should do something', async function () {
    // Arrange - 设置测试环境
    const agent = await createAgent();
    
    // Act - 执行被测试的操作
    await agent.updateState('active');
    
    // Assert - 验证结果
    expect(await agent.state()).to.equal('active');
  });
});
```

### 2. 独立性原则

每个测试用例必须独立，不依赖其他测试的执行顺序。

```javascript
// ✅ 正确：每个测试都有自己的 beforeEach
beforeEach(async function () {
  // 重置状态
  await resetState();
});

// ❌ 错误：依赖前一个测试的状态
it('test 1', async function () {
  state.value = 1;
});

it('test 2', async function () {
  expect(state.value).to.equal(1); // 依赖 test 1！
});
```

### 3. 单一职责

每个测试只验证一个概念。

```javascript
// ✅ 正确：分开测试
it('should create agent with correct name', async function () {});
it('should create agent with correct initial state', async function () {});
it('should emit AgentCreated event', async function () {});

// ❌ 错误：测试太多东西
it('should create agent correctly', async function () {
  // 验证名字、状态、事件、权限... 太多了
});
```

---

## 合约测试规范

### 事件测试

```javascript
it('Should emit AgentCreated event', async function () {
  const tx = await erc8004.createAgent('TestAgent', ['coding'], 'uri');
  
  await expect(tx)
    .to.emit(erc8004, 'AgentCreated')
    .withArgs(0, developer.address, 'TestAgent');
});
```

### 权限测试

```javascript
it('Should not allow non-owner to update state', async function () {
  await expect(
    erc8004.connect(attacker).updateState(0, 2)
  ).to.be.revertedWith('Not authorized');
});
```

### 边界值测试

```javascript
it('Should handle maximum reputation score', async function () {
  // 测试边界值
  await erc8004.recordTaskCompletion(0, true, 100);
  expect(await erc8004.reputationScore(0)).to.equal(100);
});

it('Should handle minimum reputation score', async function () {
  await erc8004.recordTaskCompletion(0, false, 0);
  expect(await erc8004.reputationScore(0)).to.equal(0);
});
```

### 状态转换测试

```javascript
describe('State Transitions', function () {
  const validTransitions = [
    { from: 'Dormant', to: 'Active' },
    { from: 'Active', to: 'Standby' },
    { from: 'Standby', to: 'Active' },
    // ...
  ];
  
  validTransitions.forEach(({ from, to }) => {
    it(`should allow transition from ${from} to ${to}`, async function () {
      // 测试状态转换
    });
  });
});
```

---

## 后端测试规范

### 异步测试

```javascript
// ✅ 正确：使用 async/await
it('should write memory', async function () {
  const result = await memorySystem.write(memory);
  expect(result).to.be.a('string');
});

// ❌ 错误：不使用 await
it('should write memory', function () {
  memorySystem.write(memory).then(result => {
    expect(result).to.be.a('string');
  });
});
```

### 错误处理测试

```javascript
it('should throw error for invalid input', async function () {
  await expect(
    memorySystem.write(null)
  ).to.be.rejectedWith('Invalid memory object');
});
```

### 模拟外部依赖

```javascript
// 使用 sinon 或 jest.mock
const sinon = require('sinon');

describe('External API', function () {
  let apiStub;
  
  beforeEach(function () {
    apiStub = sinon.stub(externalAPI, 'call');
  });
  
  afterEach(function () {
    apiStub.restore();
  });
  
  it('should handle API failure', async function () {
    apiStub.rejects(new Error('Network error'));
    
    const result = await service.callAPI();
    expect(result.success).to.be.false;
  });
});
```

---

## 测试覆盖率要求

| 模块 | 行覆盖率 | 分支覆盖率 |
|------|----------|------------|
| 智能合约 | >= 95% | >= 90% |
| 核心业务逻辑 | >= 90% | >= 85% |
| 工具函数 | >= 80% | >= 75% |

---

## 测试命名规范

### 描述性命名

```javascript
// ✅ 正确：描述行为
it('should decrease reputation after failed task');
it('should emit StateChanged event when state updates');
it('should reject non-owner state updates');

// ❌ 错误：模糊命名
it('works correctly');
it('test 1');
it('should work');
```

### 使用 should

测试描述以 "should" 开头，描述期望的行为。

---

## 测试数据管理

### 使用 fixtures

```javascript
// fixtures/agents.js
module.exports = {
  validAgent: {
    name: 'TestAgent',
    capabilities: ['coding', 'analysis'],
    metadataURI: 'ipfs://test-uri'
  },
  
  invalidAgent: {
    name: '', // 无效：空名字
    capabilities: [],
    metadataURI: ''
  }
};
```

### 工厂函数

```javascript
// test/helpers/factories.js
async function createAgent(overrides = {}) {
  const defaults = {
    name: 'TestAgent',
    capabilities: ['coding'],
    metadataURI: 'ipfs://test'
  };
  
  return await erc8004.createAgent(
    overrides.name || defaults.name,
    overrides.capabilities || defaults.capabilities,
    overrides.metadataURI || defaults.metadataURI
  );
}
```

---

## 性能测试

### Gas 消耗测试

```javascript
it('should consume reasonable gas for agent creation', async function () {
  const tx = await erc8004.createAgent('TestAgent', ['coding'], 'uri');
  const receipt = await tx.wait();
  
  expect(receipt.gasUsed).to.be.lt(500000); // 设置合理的 gas 上限
});
```

### 负载测试

```javascript
it('should handle multiple concurrent writes', async function () {
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(memorySystem.write({ content: `Memory ${i}` }));
  }
  
  const results = await Promise.all(promises);
  expect(results).to.have.lengthOf(100);
});
```

---

## 安全测试

### 重入攻击测试

```javascript
it('should prevent reentrancy attacks', async function () {
  const attacker = await deployReentrancyAttacker();
  
  await expect(
    attacker.attack(erc8004.address)
  ).to.be.reverted;
});
```

### 溢出测试

```javascript
it('should prevent integer overflow', async function () {
  await expect(
    erc8004.recordTaskCompletion(0, true, 2**256 - 1)
  ).to.be.reverted;
});
```

---

## CI/CD 集成

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run contract tests
        run: npm run contract:test
      
      - name: Run backend tests
        run: npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 运行测试

```bash
# 运行所有测试
npm test

# 运行合约测试
npm run contract:test

# 运行特定测试文件
npx hardhat test test/ERC8004.test.js

# 运行带覆盖率报告的测试
npm run test:coverage

# 运行性能测试
npm run test:performance
```

---

*"未测试的代码就是坏代码。"*

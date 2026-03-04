# Sprint 1 详细计划
**Sprint 目标**: 用户可以注册 Human 账户并存入资金
**时间**: Week 1 (5个工作日)
**团队**: 合约开发 + 前端开发 + QA

---

## 📅 每日计划

### Day 1: 基础设施 + 合约测试

#### 上午 (合约开发)
**任务**: 写 HumanRegistry 测试
```solidity
// test/human/HumanRegistry.test.js
describe('HumanRegistry', () => {
  describe('register', () => {
    it('should allow new user to register', async () => {});
    it('should reject duplicate registration', async () => {});
    it('should emit HumanRegistered event', async () => {});
    it('should require registration fee', async () => {});
  });
  
  describe('getHuman', () => {
    it('should return human data', async () => {});
    it('should return empty for non-existent', async () => {});
  });
});
```

**交付物**:
- [ ] 完整的测试文件
- [ ] 运行测试（应该失败 - 红）

---

#### 下午 (合约开发)
**任务**: 实现 HumanRegistry 合约

**交付物**:
- [ ] 合约实现
- [ ] 测试通过（绿）

---

#### 晚上 (QA)
**任务**: 审查合约测试

**检查清单**:
- [ ] 测试覆盖所有分支
- [ ] 边界情况已测试
- [ ] 事件正确触发

---

### Day 2: HumanEconomy 合约

#### 上午
**任务**: 写 HumanEconomy 测试
```solidity
describe('HumanEconomy', () => {
  describe('deposit', () => {
    it('should accept ETH deposit', async () => {});
    it('should update balance', async () => {});
    it('should emit Deposited event', async () => {});
  });
  
  describe('withdraw', () => {
    it('should allow withdrawal', async () => {});
    it('should reject insufficient balance', async () => {});
    it('should update balance', async () => {});
  });
});
```

---

#### 下午
**任务**: 实现 HumanEconomy 合约

---

#### 晚上
**任务**: 部署到本地节点，手动测试

---

### Day 3: 前端 Hooks

#### 上午 (前端开发)
**任务**: 写 useHuman hook 测试
```javascript
// src/features/human/hooks/__tests__/useHuman.test.js
describe('useHuman', () => {
  it('should register new human', async () => {});
  it('should get human profile', async () => {});
  it('should handle registration error', async () => {});
  it('should check if address is human', async () => {});
});
```

---

#### 下午
**任务**: 实现 useHuman hook

---

#### 晚上 (前端开发)
**任务**: 写 useWallet hook 测试
```javascript
describe('useWallet', () => {
  it('should deposit ETH', async () => {});
  it('should get balance', async () => {});
  it('should withdraw ETH', async () => {});
  it('should handle deposit error', async () => {});
});
```

---

### Day 4: 前端组件

#### 上午
**任务**: 实现 useWallet hook

---

#### 下午
**任务**: 写 RegistrationForm 组件测试
```javascript
describe('RegistrationForm', () => {
  it('should render form', () => {});
  it('should submit registration', () => {});
  it('should show loading state', () => {});
  it('should show success message', () => {});
  it('should handle error', () => {});
});
```

---

#### 晚上
**任务**: 实现 RegistrationForm 组件

---

### Day 5: 集成与部署

#### 上午
**任务**: 写 E2E 测试
```javascript
// e2e/human-registration.spec.js
test('complete registration flow', async () => {
  await page.goto('/');
  await page.click('[data-testid="connect-wallet"]');
  await page.click('[data-testid="register"]');
  await expect(page.locator('[data-testid="profile"]')).toBeVisible();
});
```

---

#### 下午
**任务**: 集成所有模块
- 连接合约和前端
- 修复集成问题
- 运行 E2E 测试

---

#### 晚上
**任务**: 部署到 Amoy
- 部署合约
- 更新前端配置
- 验证功能

---

## ✅ Sprint 完成标准

### 功能完成
- [ ] 用户可以连接钱包
- [ ] 用户可以注册 Human
- [ ] 用户可以查看资料
- [ ] 用户可以存入资金

### 测试完成
- [ ] 合约测试: 100% 覆盖
- [ ] Hook 测试: 100% 覆盖
- [ ] 组件测试: 100% 覆盖
- [ ] E2E 测试: 通过

### 部署完成
- [ ] 合约部署到 Amoy
- [ ] 前端部署到 Cloudflare
- [ ] 功能验证通过

---

## 🎯 每日站会问题

每个工作日开始时回答：
1. 昨天完成了什么？
2. 今天计划做什么？
3. 有什么阻碍？

---

## 📊 进度跟踪

| 日期 | 计划 | 实际 | 状态 |
|------|------|------|------|
| Day 1 | HumanRegistry 合约 | - | 🟡 待开始 |
| Day 2 | HumanEconomy 合约 | - | ⚪ 未开始 |
| Day 3 | 前端 Hooks | - | ⚪ 未开始 |
| Day 4 | 前端组件 | - | ⚪ 未开始 |
| Day 5 | 集成部署 | - | ⚪ 未开始 |

---

**准备开始 Sprint 1？**

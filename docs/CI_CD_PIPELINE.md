# TDD + CI/CD + Cloudflare 流水线

## 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         Git Push                                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 1: Code Quality                                          │
│  - ESLint (Root + Frontend)                                     │
│  - Prettier check                                               │
│  ⏱️ ~30 seconds                                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 2: Contract Tests (TDD - Red)                            │
│  - Compile contracts                                            │
│  - Run all Hardhat tests                                        │
│  - Generate coverage report                                     │
│  ⏱️ ~2 minutes                                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 3: Frontend Tests (TDD - Red)                            │
│  - Install dependencies                                         │
│  - Run Jest tests                                               │
│  - Generate coverage report                                     │
│  ⏱️ ~2 minutes                                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 4: Integration Tests (TDD - Green)                       │
│  - Start Hardhat node                                           │
│  - Deploy contracts locally                                     │
│  - Run integration tests                                        │
│  ⏱️ ~3 minutes                                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 5: Security Audit                                        │
│  - Slither static analysis                                      │
│  - npm audit                                                    │
│  ⏱️ ~2 minutes                                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 6: Build Frontend                                        │
│  - npm ci                                                       │
│  - npm run build                                                │
│  - Upload build artifact                                        │
│  ⏱️ ~2 minutes                                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 7: Deploy to Cloudflare                                  │
│  - Download build artifact                                      │
│  - Deploy to Cloudflare Pages                                   │
│  - Post deployment summary                                      │
│  ⏱️ ~1 minute                                                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 8: Notify                                                │
│  - Success: Output live URL                                     │
│  - Failure: Alert team                                          │
└─────────────────────────────────────────────────────────────────┘
```

## 触发条件

| 分支 | 行为 |
|------|------|
| `main` | 完整流水线 + 部署 |
| `develop` | 完整流水线，不部署 |
| `refactor/*` | 完整流水线 + 部署 |
| PR to `main` | 完整流水线，不部署 |

## 测试要求

### 合约测试
```bash
npm run test:human    # HumanRegistry, HumanEconomy
npm run test:agent    # AIAgentRegistry, AgentLifecycle
npm run test:task     # TaskRegistry
npm run test          # All tests
```

### 前端测试
```bash
cd frontend
npm test -- --watchAll=false --coverage
```

## 部署目标

| 环境 | URL | 触发条件 |
|------|-----|----------|
| Production | https://coidea.ai | 手动 (v1.0后) |
| Staging | https://coidea-ai.pages.dev | main 分支自动 |

## 失败处理

1. **任何阶段失败** → 停止后续阶段
2. **通知** → GitHub Actions 界面 + Summary
3. **修复** → 修复后重新 push

## 监控

- GitHub Actions 仪表板
- Cloudflare Pages 部署日志
- 测试覆盖率报告 (Codecov)

---

**流水线文件**: `.github/workflows/tdd-deploy.yml`

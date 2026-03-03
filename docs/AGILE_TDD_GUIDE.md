# Agile + TDD Development Guide

## Overview

This project follows **Agile** methodology with **Test-Driven Development (TDD)** for robust, maintainable code.

## TDD Cycle

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│   RED   │ → │  GREEN  │ → │ REFACTOR │
└─────────┘    └─────────┘    └─────────┘
   Write         Make           Improve
   failing       test           code
   test          pass
```

## CI/CD Pipeline Stages

### Phase 1: Code Quality (Fast Feedback)
- ESLint
- Prettier formatting
- TypeScript checks

### Phase 2: Unit Tests (TDD - Red Phase)
- Contract tests
- Backend tests
- Frontend tests
- Coverage reporting

### Phase 3: Integration Tests (TDD - Green Phase)
- Local Hardhat node
- Contract deployment
- API integration
- E2E tests

### Phase 4: Security Audit (TDD - Refactor Phase)
- Slither analysis
- npm audit
- Security tests

### Phase 5: Performance Tests
- Load testing
- Bundle size check
- Gas optimization

### Phase 6: Deploy to Amoy (Testnet)
- Contract deployment
- PolygonScan verification
- Sourcify verification

### Phase 7: Deploy Frontend
- Cloudflare Pages
- Environment configuration

### Phase 8: Deploy to Production (Mainnet)
- Manual trigger only
- Production environment
- Tag creation

## Branch Strategy

```
main        → Production ready
  ↑
develop     → Integration branch
  ↑
feature/*   → Feature branches
  ↑
bugfix/*    → Bug fix branches
```

## Commit Convention

```
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Code style (no logic change)
refactor: Code refactoring
test:     Adding tests
chore:    Maintenance tasks
security: Security fixes
tdd:      TDD cycle completion
```

## Workflow

### 1. Start New Feature

```bash
# Create feature branch
git checkout -b feature/new-feature

# Write failing test (Red)
npm run test:watch

# Implement feature (Green)
# ... code ...

# Refactor
# ... improve ...

# Commit
git commit -m "feat: add new feature

- Add feature implementation
- Add unit tests
- Update documentation

TDD: Red → Green → Refactor ✅"
```

### 2. Create PR

1. Push branch
2. Create PR using template
3. Ensure all CI checks pass
4. Request review
5. Merge to develop

### 3. Deploy to Testnet

- Auto-deploys to Amoy on merge to develop
- Run integration tests
- Verify contracts

### 4. Deploy to Production

- Manual trigger required
- Deploys to mainnet
- Creates version tag

## Testing Pyramid

```
        /\
       /  \     E2E (26 tests)
      /____\
     /      \   Integration (13 tests)
    /________\
   /          \ Unit (325+ tests)
  /____________\
```

## Definition of Done

- [ ] Code written following TDD
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance acceptable
- [ ] Deployed to testnet
- [ ] Manual testing completed

## Sprint Cycle

| Week | Activity |
|------|----------|
| Mon  | Sprint planning |
| Tue  | Development (TDD) |
| Wed  | Development (TDD) |
| Thu  | Testing & Review |
| Fri  | Deployment & Retro |

## Tools

- **CI/CD**: GitHub Actions
- **Testing**: Jest, Hardhat, Playwright
- **Security**: Slither, npm audit
- **Deployment**: Hardhat, Cloudflare Pages
- **Monitoring**: (To be added)

## Resources

- [TDD Best Practices](https://testdriven.io/)
- [Agile Manifesto](https://agilemanifesto.org/)
- [Solidity Security](https://consensys.github.io/smart-contract-best-practices/)

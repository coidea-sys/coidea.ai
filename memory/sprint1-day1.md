# Sprint 1 - Day 1
**Date**: 2026-03-05
**Focus**: HumanRegistry Contract (TDD)

---

## Morning Session: Write Tests

Starting with test-first development for HumanRegistry.

### Test Structure
```
test/human/
├── HumanRegistry.test.js
└── HumanEconomy.test.js
```

### Tests to Write

1. **Registration**
   - new user can register
   - duplicate registration rejected
   - event emitted correctly
   - registration fee required

2. **Profile Query**
   - get human data
   - empty for non-existent

3. **Access Control**
   - only owner can pause
   - paused state blocks registration

---

## Progress Log

### 03:18 - Sprint Kickoff
- Created memory node
- Starting test writing

---

## Current Branch
`refactor/v2.0` (to be created)

## Official Domain
https://coidea.ai

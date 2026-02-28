# GitHub DevOps Setup Guide for coidea.ai

## Repository Configuration

### 1. Repository Settings

Navigate to: `https://github.com/coidea-sys/coidea.ai/settings`

#### General Settings
- **Default branch**: `main`
- **Features**:
  - ✅ Issues
  - ✅ Discussions
  - ✅ Projects
  - ✅ Wiki (for documentation)
  - ✅ Sponsorships (optional)

#### Branch Protection Rules

Create rule for `main` branch:
- ✅ Require a pull request before merging
  - ✅ Require approvals (1)
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from Code Owners
- ✅ Require status checks to pass before merging
  - Status checks: `test-contracts`, `test-backend`, `lint`
- ✅ Require conversation resolution before merging
- ✅ Include administrators

#### Actions Permissions
- **Actions permissions**: Allow all actions and reusable workflows
- **Workflow permissions**: Read and write permissions

### 2. Secrets Configuration

Navigate to: `https://github.com/coidea-sys/coidea.ai/settings/secrets/actions`

Add the following secrets:

```
POLYGON_RPC_URL          # Polygon RPC endpoint
PRIVATE_KEY              # Deployer private key (for testnet)
POLYGONSCAN_API_KEY      # For contract verification
CODECOV_TOKEN            # Codecov upload token
```

### 3. GitHub Pages (Documentation)

Navigate to: `https://github.com/coidea-sys/coidea.ai/settings/pages`

- **Source**: Deploy from a branch
- **Branch**: `gh-pages` / `docs`
- **Folder**: `/docs`

### 4. Issue Templates

Create `.github/ISSUE_TEMPLATE/bug_report.yml`:

```yaml
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
body:
  - type: textarea
    id: description
    attributes:
      label: Description
      description: A clear description of the bug
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Steps to Reproduce
      description: Steps to reproduce the behavior
    validations:
      required: true
```

### 5. Pull Request Template

Create `.github/pull_request_template.md`:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] All tests pass
- [ ] Added new tests
- [ ] Manually tested

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### 6. Code Owners

Create `.github/CODEOWNERS`:

```
# Global owners
* @danny @kimi-claw

# Contracts
/contracts/ @danny @kimi-claw

# Backend
/backend/ @kimi-claw

# Frontend
/frontend/ @danny

# Documentation
/docs/ @kimi-claw
```

### 7. Labels

Create custom labels:

| Label | Color | Description |
|-------|-------|-------------|
| `contract` | #0052CC | Smart contract related |
| `frontend` | #5319E7 | Frontend related |
| `backend` | #0E8A16 | Backend related |
| `documentation` | #0075CA | Documentation |
| `good first issue` | #7057FF | Good for newcomers |
| `help wanted` | #008672 | Extra attention needed |
| `priority:high` | #B60205 | High priority |
| `priority:medium` | #FBCA04 | Medium priority |
| `priority:low` | #0E8A16 | Low priority |

### 8. Projects Board

Create a project board:
- **Template**: Automated kanban
- **Columns**: Backlog, To Do, In Progress, Review, Done
- **Automations**: 
  - New issues → Backlog
  - PR opened → Review
  - PR merged → Done

### 9. Discussions Categories

Set up discussion categories:
- General
- Ideas
- Q&A
- Show and tell
- Security (private)

### 10. Release Process

Create release workflow `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
```

## Local Development Setup

```bash
# Clone the repository
git clone https://github.com/coidea-sys/coidea.ai.git
cd coidea.ai

# Install dependencies
npm install

# Run all tests
npm test

# Start local development
npm run dev
```

## Deployment Workflow

### Testnet Deployment

```bash
# Deploy to Polygon Amoy
npx hardhat run scripts/deploy.js --network amoy

# Verify contracts
npx hardhat verify --network amoy CONTRACT_ADDRESS
```

### Mainnet Deployment

1. Create release branch: `git checkout -b release/v0.1.0`
2. Update version in `package.json`
3. Update `CHANGELOG.md`
4. Create PR to `main`
5. After merge, tag release: `git tag v0.1.0`
6. Push tag: `git push origin v0.1.0`
7. GitHub Actions will automatically deploy

---

*Setup guide created by Kimi Claw*

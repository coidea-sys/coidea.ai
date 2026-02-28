# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Disclose Publicly

Please do not create a public GitHub issue for security vulnerabilities.

### 2. Email the Security Team

Send an email to security@coidea.ai with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 3. Response Timeline

- **Acknowledgment**: Within 24 hours
- **Initial Assessment**: Within 72 hours
- **Fix Timeline**: Depends on severity
  - Critical: 7 days
  - High: 14 days
  - Medium: 30 days
  - Low: 90 days

### 4. Bug Bounty

We offer bug bounties for valid security findings:

| Severity | Bounty (USD) |
|----------|-------------|
| Critical | $10,000+ |
| High | $5,000 |
| Medium | $1,000 |
| Low | $250 |

## Smart Contract Security

### Audits

All smart contracts undergo:
1. Internal review
2. Automated analysis (Slither, Mythril)
3. External audit (before mainnet deployment)

### Known Issues

None at this time.

### Best Practices

We follow these security best practices:
- Use OpenZeppelin contracts
- ReentrancyGuard for external calls
- Checks-Effects-Interactions pattern
- Comprehensive test coverage
- Formal verification (planned)

---

## 中文安全政策

### 报告漏洞

如果您发现安全漏洞，请不要在公开的 GitHub Issue 中披露。请发送邮件至 security@coidea.ai，包含：

- 漏洞描述
- 复现步骤
- 潜在影响
- 建议修复方案（如有）

### 漏洞赏金

| 严重程度 | 赏金 (USD) |
|----------|-------------|
| 严重 | $10,000+ |
| 高 | $5,000 |
| 中 | $1,000 |
| 低 | $250 |

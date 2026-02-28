# Contributing to coidea.ai

Thank you for your interest in contributing to coidea.ai! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to see if the problem has already been reported. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what behavior you expected**
- **Include code samples and screenshots if applicable**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the enhancement**
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repository
2. Create a new branch from `develop`: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -am 'Add new feature'`
6. Push to the branch: `git push origin feature/my-feature`
7. Submit a pull request to the `develop` branch

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/coidea.ai.git
cd coidea.ai

# Install dependencies
npm install

# Run tests
npm test

# Start local blockchain
npx hardhat node
```

## Style Guidelines

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### Solidity Style Guide

- Follow the [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use `camelCase` for function and variable names
- Use `PascalCase` for contract and struct names
- Use `UPPER_CASE` for constants
- Add NatSpec comments for all public functions

### JavaScript/TypeScript Style Guide

- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas

## Testing

All contributions must include tests. We use:
- **Hardhat** for contract testing
- **Jest** for backend testing
- **React Testing Library** for frontend testing

```bash
# Run all tests
npm test

# Run contract tests
npm run contract:test

# Run with coverage
npm run test:coverage
```

## Smart Contract Security

- All contracts must be reviewed by at least one other developer
- Use OpenZeppelin contracts where possible
- Run Slither static analysis before submitting
- Consider edge cases and add appropriate checks

## Documentation

- Update the README.md if you change functionality
- Add JSDoc comments for JavaScript functions
- Add NatSpec comments for Solidity functions
- Update relevant documentation in the `/docs` folder

## License

By contributing to coidea.ai, you agree that your contributions will be licensed under the MIT License.

---

## 中文贡献指南

### 提交规范

- 使用英文提交代码和注释
- 文档可以双语（英文优先）
- Issue 和 PR 描述可以用中文

### 代码风格

- Solidity: 遵循官方风格指南
- JavaScript: 遵循 Airbnb 风格指南
- 所有公共函数必须添加文档注释

### 测试要求

- 所有代码提交必须包含测试
- 合约代码测试覆盖率需达到 90% 以上
- 运行 `npm test` 确保所有测试通过

感谢您的贡献！

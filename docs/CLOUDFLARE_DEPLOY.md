# Cloudflare Pages 部署指南

## 目标
将 coidea.ai 前端部署到 Cloudflare Pages，使用模拟数据演示功能。

## 步骤

### 1. 构建配置
- 创建 `wrangler.toml` 配置文件
- 配置构建设置
- 设置环境变量

### 2. 模拟数据模式
- 创建 `useMockData` hook
- 所有合约调用使用模拟数据
- 保持 UI 完整功能

### 3. 构建和部署
- 运行 `npm run build`
- 使用 Wrangler 部署
- 配置自定义域名（可选）

### 4. 验证
- 访问部署的 URL
- 测试所有页面功能
- 确认模拟数据正常显示

## 文件结构
```
coidea.ai/
├── wrangler.toml          # Cloudflare 配置
├── .github/workflows/     # GitHub Actions 自动部署
│   └── deploy-cf.yml
├── frontend/
│   ├── src/
│   │   └── hooks/
│   │       └── useMockMode.js  # 模拟数据开关
```

## 注意事项
- 此部署仅用于演示，无真实区块链交互
- 所有交易、数据都是模拟的
- 可随时切换回真实合约模式

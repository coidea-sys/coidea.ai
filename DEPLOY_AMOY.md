# 测试网部署指南

## 当前状态

### 代码已提交
- ✅ 前端构建成功
- ✅ 默认网络改为 Amoy 测试网
- ✅ HumanRegistration 和 WalletManager 已启用

### 构建输出
```
frontend/build/
├── static/js/main.63587f43.js (180.33 kB)
├── static/css/main.b675124a.css (8.66 kB)
└── ...
```

## 部署步骤

### 1. 获取 Cloudflare API Token
访问: https://dash.cloudflare.com/profile/api-tokens
- 创建 Token
- 权限: Cloudflare Pages:Edit
- 区域: 包含 coidea-ai 项目

### 2. 设置环境变量
```bash
export CLOUDFLARE_API_TOKEN="your_token_here"
```

### 3. 部署
```bash
cd /root/.openclaw/workspace/projects/coidea.ai
wrangler pages deploy frontend/build --project-name=coidea-ai --branch=amoy-test
```

### 4. 访问测试网版本
部署完成后访问:
```
https://amoy-test.coidea-ai.pages.dev
```

## 测试清单

### Human 注册流程
- [ ] 连接 MetaMask
- [ ] 切换到 Amoy 测试网
- [ ] 访问 Human 页面
- [ ] 填写用户名注册
- [ ] 确认交易
- [ ] 验证注册成功

### 钱包管理
- [ ] 查看余额
- [ ] 存款 ETH
- [ ] 提款 ETH

## Amoy 测试网信息

- **Network**: Polygon Amoy
- **Chain ID**: 80002
- **RPC**: https://rpc-amoy.polygon.technology
- **Faucet**: https://faucet.polygon.technology

## 合约地址

| 合约 | 地址 |
|------|------|
| HumanRegistry | 0xa7049DB55AE7D67FBC006734752DD1fe24687bE3 |
| HumanEconomy | 0x2FC0a1B77047833Abb836048Dec3585f27c9f01a |
| TaskRegistry | 0xE8eb60EB3cFEaC27fb9D0bC52d5DE346206D3fAE |

---
**部署状态**: 等待 Cloudflare API Token

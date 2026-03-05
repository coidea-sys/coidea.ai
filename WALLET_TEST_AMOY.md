# Wallet 功能测试清单 - Amoy 网络

## 测试环境
- **网络**: Polygon Amoy Testnet
- **Chain ID**: 80002
- **HumanEconomy 合约**: 0x2FC0a1B77047833Abb836048Dec3585f27c9f01a
- **代币**: POL

## 测试步骤

### 1. 连接钱包
- [ ] 访问 https://coidea-ai.pages.dev
- [ ] 点击 "Connect Wallet"
- [ ] 选择 MetaMask
- [ ] 确认切换到 Amoy 网络

### 2. 获取测试币
- [ ] 访问 https://faucet.polygon.technology
- [ ] 选择 Amoy 网络
- [ ] 输入钱包地址
- [ ] 获取测试 POL

### 3. 注册 Human
- [ ] 点击 Human tab
- [ ] 填写用户名
- [ ] 点击注册
- [ ] 确认交易 (0.001 POL)

### 4. 测试存款
- [ ] 进入钱包页面
- [ ] 输入存款金额 (如 0.01 POL)
- [ ] 点击存款
- [ ] 确认 MetaMask 交易
- [ ] 验证余额增加

### 5. 测试提款
- [ ] 输入提款金额 (如 0.005 POL)
- [ ] 点击提款
- [ ] 确认 MetaMask 交易
- [ ] 验证余额减少

### 6. 验证交易
- [ ] 复制交易哈希
- [ ] 访问 https://amoy.polygonscan.com
- [ ] 查看交易详情

## 预期结果
- 所有交易在 Amoy 网络上成功执行
- 余额正确显示
- 交易可在 Amoy PolygonScan 上查看

## 问题排查

### 如果交易失败
1. 检查是否有足够的 POL 支付 gas
2. 检查网络是否为 Amoy (Chain ID 80002)
3. 检查是否已注册 Human

### 如果余额不显示
1. 刷新页面
2. 重新连接钱包
3. 检查控制台错误信息

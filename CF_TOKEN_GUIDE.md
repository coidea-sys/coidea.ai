# Cloudflare API Token 权限要求

## 部署 Pages 需要的权限

### 必需权限
1. **Cloudflare Pages:Edit** - 部署页面
2. **Zone:Read** - 读取区域信息
3. **User Details:Read** - 读取用户信息

### 推荐权限组合
```
Account: Cloudflare Pages:Edit
Zone: Zone:Read
User: User Details:Read
```

## 创建步骤

1. 访问 https://dash.cloudflare.com/profile/api-tokens
2. 点击 **Create Token**
3. 选择 **Custom token**
4. 添加权限：
   - Account - Cloudflare Pages - Edit
   - Zone - Zone - Read
   - User - User Details - Read
5. Account Resources: Include - 你的账户
6. Zone Resources: Include - All zones 或指定域名

## 当前问题

Token `Rd4yen8IFh0KCFFRHLr2cXOU6KkUVMlWro1k5X9B` 认证失败，可能原因：
- 缺少 User Details:Read 权限
- 缺少 Zone:Read 权限
- Token 已过期或被删除

请重新创建 Token 并确保包含上述所有权限。

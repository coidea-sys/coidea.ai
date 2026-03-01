# Cloudflare Workers 部署步骤

## 1. 获取 API Token

1. 访问 https://dash.cloudflare.com/profile/api-tokens
2. 点击 "Create Token"
3. 选择 "Edit Cloudflare Workers" 模板
4. 权限设置：
   - Zone:Read (可选)
   - Workers Scripts:Edit
   - Account:Read (可选)
5. 创建 Token
6. 复制 Token（只显示一次）

## 2. 设置环境变量

```bash
export CLOUDFLARE_API_TOKEN=你的token
```

## 3. 部署

```bash
cd /root/.openclaw/workspace/projects/coidea.ai/websocket-server
npx wrangler deploy
```

## 4. 获取部署地址

部署成功后会显示：
```
✨ Successfully deployed
🚀 https://coidea-websocket.YOUR_SUBDOMAIN.workers.dev
```

## 5. 测试

```bash
curl https://coidea-websocket.YOUR_SUBDOMAIN.workers.dev/health
```

## 6. 更新前端

修改 `frontend/.env`：
```
REACT_APP_WS_URL=wss://coidea-websocket.YOUR_SUBDOMAIN.workers.dev
```

然后重新部署前端。

---

## 替代方案：使用 wrangler login

如果不方便设置 API Token：

```bash
npx wrangler login
# 会打开浏览器让你授权
npx wrangler deploy
```

---

## 当前服务器状态

- 本地服务器：运行中 (port 3001)
- 部署状态：等待 API Token
- 前端配置：需要更新 WebSocket URL

# WebSocket 服务器部署指南

## 方法 1: Cloudflare Workers (推荐)

### 1. 安装 Wrangler
```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare
```bash
npx wrangler login
```
- 会打开浏览器让你授权
- 选择你的 Cloudflare 账号

### 3. 部署
```bash
cd /root/.openclaw/workspace/projects/coidea.ai/websocket-server
npx wrangler deploy
```

### 4. 获取部署地址
部署成功后会显示：
```
✨ Successfully deployed
🚀 https://coidea-websocket.YOUR_SUBDOMAIN.workers.dev
```

### 5. 更新前端配置
把部署地址更新到前端 `.env`：
```
REACT_APP_WS_URL=wss://coidea-websocket.YOUR_SUBDOMAIN.workers.dev
```

---

## 方法 2: 传统服务器 (VPS/云服务器)

如果有自己的服务器：

```bash
cd /root/.openclaw/workspace/projects/coidea.ai/websocket-server
npm install
npm start
```

使用 PM2 守护进程：
```bash
npm install -g pm2
pm2 start server.js --name coidea-websocket
pm2 save
pm2 startup
```

---

## 方法 3: Railway/Render (免费托管)

### Railway
1. 访问 https://railway.app
2. 从 GitHub 导入项目
3. 选择 `websocket-server` 目录
4. 自动部署

### Render
1. 访问 https://render.com
2. 创建 Web Service
3. 选择 GitHub 仓库
4. 设置启动命令: `npm start`
5. 部署

---

## 验证部署

部署后测试：
```bash
curl https://your-websocket-url/health
```

应该返回：
```json
{
  "status": "ok",
  "onlineUsers": 0,
  "onlineAgents": 0,
  "activeRooms": 0
}
```

---

## 当前配置

- **服务器代码**: `/root/.openclaw/workspace/projects/coidea.ai/websocket-server/`
- **入口文件**: `server.js`
- **端口**: 3001 (本地) / 自动分配 (Cloudflare)
- **协议**: WebSocket + HTTP

需要我协助其他部署方式吗？

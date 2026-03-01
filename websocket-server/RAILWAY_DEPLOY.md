# Railway 快速部署（推荐）

Railway 是免费的 PaaS 平台，部署非常简单。

## 步骤

### 1. 准备代码
代码已准备好，在 `websocket-server/` 目录。

### 2. 部署到 Railway

#### 方法 A: 通过 Railway CLI
```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 进入项目目录
cd /root/.openclaw/workspace/projects/coidea.ai/websocket-server

# 创建项目
railway init

# 部署
railway up

# 获取域名
railway domain
```

#### 方法 B: 通过 GitHub（推荐）
1. 访问 https://railway.app
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择 `coidea-sys/coidea.ai`
5. 设置：
   - Root Directory: `websocket-server`
   - Start Command: `npm start`
6. 点击 Deploy
7. 部署完成后，点击 "Settings" → "Domains" 查看 URL

### 3. 配置环境变量
在 Railway Dashboard 中添加：
- `FRONTEND_URL` = `https://coidea-ai.pages.dev`
- `NODE_ENV` = `production`

### 4. 更新前端
把 Railway 提供的域名更新到前端：
```
REACT_APP_WS_URL=wss://your-app.railway.app
```

---

## 验证部署

```bash
curl https://your-app.railway.app/health
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

## 优点
- ✅ 免费额度足够
- ✅ 自动 HTTPS
- ✅ 持续部署（GitHub 推送自动更新）
- ✅ 比 Cloudflare Workers 更简单

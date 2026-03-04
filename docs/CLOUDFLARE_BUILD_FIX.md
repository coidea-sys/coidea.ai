# Cloudflare Pages 构建配置

## 问题
Cloudflare Pages 默认使用 `npm ci`，但我们的 `package.json` 和 `package-lock.json` 不同步。

## 解决方案

### 方法 1: 在 Cloudflare Dashboard 中配置（推荐）

1. 登录 https://dash.cloudflare.com
2. 进入 Pages > coidea-ai
3. 点击 "Settings" > "Build & Deploy"
4. 修改 "Build command":
   ```
   npm install --legacy-peer-deps && npm run build
   ```
5. 修改 "Build output directory":
   ```
   frontend/build
   ```
6. 添加环境变量：
   - `NODE_VERSION`: `20`
   - `REACT_APP_NETWORK`: `amoy`

### 方法 2: 同步 package-lock.json

运行以下命令重新生成 lock 文件：
```bash
rm package-lock.json
npm install --legacy-peer-deps
npm run build
git add package-lock.json
git commit -m "chore: sync package-lock.json"
```

## 当前状态

- 分支: `refactor/v2.0`
- 构建命令需要手动在 Dashboard 配置
- 或者使用 GitHub Actions 部署（已配置）

## GitHub Actions 部署（备用）

如果 Cloudflare Pages 自动构建失败，GitHub Actions 会接管部署：
- 工作流: `.github/workflows/tdd-deploy.yml`
- 触发: push 到 `refactor/v2.0` 分支

# Cloudflare Pages Git 集成说明

## 当前配置

### Git 集成（推荐方式）
- Cloudflare Pages 直接连接 GitHub 仓库
- 每次推送到 `refactor/v2.0` 分支自动触发部署
- 不需要 GitHub Actions

### 构建设置
```
Framework preset: Create React App
Build command: cd frontend && npm install --legacy-peer-deps && npm run build
Build output directory: frontend/build
Root directory: /
```

### 环境变量
```
REACT_APP_NETWORK=amoy
```

## 部署流程

1. 推送代码到 GitHub
   ```bash
   git push origin refactor/v2.0
   ```

2. Cloudflare 自动检测推送
   - 克隆仓库
   - 运行构建命令
   - 部署到 Pages

3. 查看部署状态
   - 访问 https://dash.cloudflare.com
   - 进入 Pages > coidea-ai 项目
   - 查看部署日志

## 访问地址

部署完成后访问：
```
https://coidea-ai.pages.dev
```

## 故障排查

### 如果部署失败
1. 检查 Cloudflare Dashboard 的部署日志
2. 确保构建命令正确
3. 检查环境变量设置

### 如果更改未生效
1. 清除浏览器缓存
2. 检查是否推送到正确分支
3. 等待部署完成（通常 1-2 分钟）

---

**注意**: 已移除 GitHub Actions 工作流，使用 Cloudflare 原生 Git 集成。

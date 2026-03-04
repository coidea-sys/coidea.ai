# GitHub + Cloudflare 自动部署配置

## 步骤 1: 获取 Cloudflare Account ID

1. 登录 https://dash.cloudflare.com
2. 选择任意域名或 Pages 项目
3. 在右侧边栏找到 **Account ID**
4. 复制这个 ID

## 步骤 2: 创建 Cloudflare API Token

1. 访问 https://dash.cloudflare.com/profile/api-tokens
2. 点击 **Create Token** → **Custom token**
3. 配置：
   - **Token name**: `github-actions-deploy`
   - **Permissions**:
     - `Cloudflare Pages` - `Edit`
   - **Account Resources**: Include - 你的账户
   - **Zone Resources**: Include - All zones
4. 创建并复制 Token

## 步骤 3: 在 GitHub 设置 Secrets

1. 打开仓库: https://github.com/coidea-sys/coidea.ai
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加以下 secrets:

| Name | Value |
|------|-------|
| `CLOUDFLARE_API_TOKEN` | 步骤2创建的 Token |
| `CLOUDFLARE_ACCOUNT_ID` | 步骤1获取的 Account ID |

## 步骤 4: 触发部署

推送代码到 `refactor/v2.0` 分支即可自动部署：

```bash
git push origin refactor/v2.0
```

## 部署状态

- 访问 GitHub Actions 查看部署状态: 
  https://github.com/coidea-sys/coidea.ai/actions
- 部署完成后访问:
  https://coidea-ai.pages.dev

---
配置完成后，每次推送到 refactor/v2.0 分支都会自动部署！

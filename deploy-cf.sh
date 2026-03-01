#!/bin/bash
# 手动部署到 Cloudflare Pages

echo "🚀 Deploying coidea.ai to Cloudflare Pages..."

# 1. 构建前端
echo "📦 Building frontend..."
cd frontend
npm install
REACT_APP_MOCK_MODE=true npm run build

# 2. 检查 wrangler 是否安装
if ! command -v wrangler &> /dev/null
then
    echo "📥 Installing wrangler..."
    npm install -g wrangler
fi

# 3. 登录 Cloudflare（如果需要）
# wrangler login

# 4. 部署
echo "🚀 Deploying..."
wrangler pages deploy build --project-name=coidea-ai

echo "✅ Deployment complete!"
echo "🌐 Visit: https://coidea-ai.pages.dev"

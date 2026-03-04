#!/bin/bash
# 监控 GitHub Actions 工作流状态

echo "🔍 监控 GitHub Actions 工作流..."
echo "仓库: coidea-sys/coidea.ai"
echo "分支: refactor/v2.0"
echo ""

# 使用 gh CLI 获取最近的工作流运行
gh run list --repo coidea-sys/coidea.ai --branch refactor/v2.0 --limit 5 --json name,status,conclusion,url,createdAt | jq -r '.[] | "\(.createdAt) | \(.name) | \(.status) | \(.conclusion // "-") | \(.url)"' 2>/dev/null || echo "需要 gh CLI 或检查权限"

echo ""
echo "📊 最近提交:"
git log --oneline -3

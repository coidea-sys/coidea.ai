#!/bin/bash
# Check GitHub Actions status via API

REPO="coidea-sys/coidea.ai"
BRANCH="refactor/v2.0"

echo "Checking GitHub Actions status..."
echo "Repo: $REPO"
echo "Branch: $BRANCH"
echo ""

# Get latest workflow run
curl -s "https://api.github.com/repos/$REPO/actions/runs?branch=$BRANCH&per_page=1" | \
  jq -r '.workflow_runs[0] | "Run ID: \(.id)\nStatus: \(.status)\nConclusion: \(.conclusion)\nURL: \(.html_url)"' 2>/dev/null || \
  echo "Failed to fetch status. Check manually at: https://github.com/$REPO/actions"

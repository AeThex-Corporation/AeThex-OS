#!/usr/bin/env bash
set -euo pipefail

# Trigger GitLab CI pipeline for AeThex-OS ISO build
# Usage: ./trigger-gitlab-pipeline.sh [branch] [token]
# Defaults: branch=main, token=$GITLAB_TOKEN

BRANCH="${1:-main}"
TOKEN="${2:-${GITLAB_TOKEN:-}}"

if [ -z "$TOKEN" ]; then
  echo "❌ GITLAB_TOKEN not set and no token provided as argument."
  echo "Usage: $0 [branch] [token]"
  echo "Or export GITLAB_TOKEN=your_token_here"
  exit 1
fi

PROJECT_ID="MrPiglr%2FAeThex-OS"  # URL-encoded namespace/project
GITLAB_URL="https://gitlab.com/api/v4"

echo "🚀 Triggering GitLab pipeline on branch: $BRANCH"

RESPONSE=$(curl -s -X POST \
  "${GITLAB_URL}/projects/${PROJECT_ID}/pipeline" \
  -H "PRIVATE-TOKEN: $TOKEN" \
  -d "ref=${BRANCH}")

echo "$RESPONSE" | jq . || echo "$RESPONSE"

PIPELINE_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
if [ -n "$PIPELINE_ID" ]; then
  echo "✅ Pipeline #$PIPELINE_ID created"
  echo "📊 View at: https://gitlab.com/MrPiglr/AeThex-OS/-/pipelines/$PIPELINE_ID"
else
  echo "⚠️ No pipeline ID returned; check your token and project access."
fi

#!/usr/bin/env bash
set -euo pipefail

GITLAB_HOST="${GITLAB_HOST:-https://gitlab.com}"
API_BASE="$GITLAB_HOST/api/v4"

PROJECT_PATH="${PROJECT_PATH:-}"
REF="${REF:-main}"
JOB_NAME="${JOB_NAME:-build_iso}"
PIPELINE_ID="${PIPELINE_ID:-}"
OUT_DIR="${OUT_DIR:-artifacts}"

if [[ -z "${GITLAB_TOKEN:-}" ]]; then
  if [[ -n "${GITLAB_TOKEN_FILE:-}" && -r "$GITLAB_TOKEN_FILE" ]]; then
    GITLAB_TOKEN=$(cat "$GITLAB_TOKEN_FILE")
  else
    echo "GITLAB_TOKEN is required. Set GITLAB_TOKEN or GITLAB_TOKEN_FILE." >&2
    echo "Example: export GITLAB_TOKEN=... or export GITLAB_TOKEN_FILE=~/gitlab.token" >&2
    exit 1
  fi
fi

if [[ -z "$PROJECT_PATH" ]]; then
  echo "PROJECT_PATH is required (e.g., AeThex-Corporation/AeThex-OS)" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

urlencode_project() {
  echo -n "$PROJECT_PATH" | sed -e 's/\//%2F/g'
}

PROJECT_ENC="$(urlencode_project)"

auth() {
  echo "PRIVATE-TOKEN: $GITLAB_TOKEN"
}

get_json() {
  local url="$1"
  curl -sS -H "$(auth)" "$url"
}

require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    echo "jq is required. Install with: sudo apt-get update && sudo apt-get install -y jq" >&2
    exit 1
  fi
}

require_jq

if [[ -z "$PIPELINE_ID" ]]; then
  PIPELINE_ID=$(get_json "$API_BASE/projects/$PROJECT_ENC/pipelines?ref=$REF&status=success&order_by=updated_at&sort=desc&per_page=1" | jq -r '.[0].id')
  if [[ -z "$PIPELINE_ID" || "$PIPELINE_ID" == "null" ]]; then
    echo "No successful pipeline found for ref=$REF" >&2
    exit 1
  fi
fi

JOBS_JSON=$(get_json "$API_BASE/projects/$PROJECT_ENC/pipelines/$PIPELINE_ID/jobs?scope=success")
JOB_ID=$(echo "$JOBS_JSON" | jq -r --arg name "$JOB_NAME" '[.[] | select(.name == $name and .artifacts_file and (.artifacts_file.filename != null))][0].id')

if [[ -z "$JOB_ID" || "$JOB_ID" == "null" ]]; then
  echo "No job with artifacts found matching name=$JOB_NAME in pipeline=$PIPELINE_ID" >&2
  echo "Available job names:" >&2
  echo "$JOBS_JSON" | jq -r '.[].name' >&2
  exit 1
fi

ART_ZIP="$OUT_DIR/${PIPELINE_ID}-${JOB_NAME}.zip"
echo "Downloading artifacts from job $JOB_ID to $ART_ZIP"
curl -fSL -H "$(auth)" "$API_BASE/projects/$PROJECT_ENC/jobs/$JOB_ID/artifacts" -o "$ART_ZIP"

echo "Extracting $ART_ZIP"
unzip -o "$ART_ZIP" -d "$OUT_DIR" >/dev/null

ISO_PATH=$(find "$OUT_DIR" -type f -name '*.iso' | head -n 1 || true)
if [[ -n "$ISO_PATH" ]]; then
  echo "Found ISO: $ISO_PATH"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$ISO_PATH" | tee "$ISO_PATH.sha256.txt"
  fi
else
  echo "No ISO file found in artifacts. Contents:" >&2
  find "$OUT_DIR" -maxdepth 2 -type f -printf '%p\n' >&2
fi

echo "Done. Artifacts in $OUT_DIR"

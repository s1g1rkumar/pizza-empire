#!/usr/bin/env bash
set -euo pipefail

# Emergency Rollback Script for Pizza Empire Tycoon
APP_DIR="${APP_DIR:-/var/www/pizza-empire}"
TARGET_REF="${1:-}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:4000/api/v1/health}"

cd "${APP_DIR}"

if [[ -z "${TARGET_REF}" ]]; then
  if [[ -f "${APP_DIR}/.last_good_commit" ]]; then
    TARGET_REF="$(cat "${APP_DIR}/.last_good_commit")"
  else
    echo "Usage: $0 <git-commit-or-tag>"
    exit 1
  fi
fi

echo "=== Rolling back to ${TARGET_REF} ==="
git checkout "${TARGET_REF}"

cd "${APP_DIR}/backend"
npm ci
npm run build

cd "${APP_DIR}/frontend"
npm ci
npm run build

cd "${APP_DIR}"
pm2 reload deploy/ecosystem.config.cjs --env production
sleep 3
curl -fsS "${HEALTH_URL}" >/dev/null

echo "Rollback to ${TARGET_REF} completed and API is healthy."
echo "NOTE: If a database migration must be reverted, restore from /var/backups/pizza-empire/*.sql.gz"

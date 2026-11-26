#!/usr/bin/env bash
set -euo pipefail

# Zero-downtime / Safe Production Deployment Script for Ubuntu Server
APP_DIR="${APP_DIR:-/var/www/pizza-empire}"
BRANCH="${BRANCH:-main}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:4000/api/v1/health}"

echo "=== [1/7] Backing up MySQL before deployment ==="
bash "${APP_DIR}/deploy/scripts/backup_mysql.sh"

echo "=== [2/7] Pulling latest release from ${BRANCH} ==="
cd "${APP_DIR}"
PREV_COMMIT="$(git rev-parse HEAD)"
echo "${PREV_COMMIT}" > "${APP_DIR}/.last_good_commit"
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"

echo "=== [3/7] Installing & building backend ==="
cd "${APP_DIR}/backend"
npm ci
npm run build

echo "=== [4/7] Running database migrations ==="
npm run migrate

echo "=== [5/7] Installing & building frontend ==="
cd "${APP_DIR}/frontend"
npm ci
npm run build

echo "=== [6/7] Reloading PM2 process ==="
cd "${APP_DIR}"
pm2 reload deploy/ecosystem.config.cjs --env production || pm2 start deploy/ecosystem.config.cjs --env production
pm2 save

echo "=== [7/7] Verifying API health ==="
sleep 3
curl -fsS "${HEALTH_URL}" >/dev/null
echo "Deployment succeeded! Previous commit saved in ${APP_DIR}/.last_good_commit (${PREV_COMMIT})."

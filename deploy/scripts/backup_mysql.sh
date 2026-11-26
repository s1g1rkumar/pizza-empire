#!/usr/bin/env bash
set -euo pipefail

# Automated MySQL 8 Backup Script for Pizza Empire Tycoon
# Reads MySQL credentials from ~/.my.cnf (chmod 600) — never hardcode passwords.

BACKUP_DIR="${BACKUP_DIR:-/var/backups/pizza-empire}"
DB_NAME="${DB_NAME:-pizza_empire_prod}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date -u +'%Y%m%d_%H%M%S')"
OUT_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

echo "[$(date -u)] Starting MySQL backup for ${DB_NAME}..."
mysqldump \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --set-gtid-purged=OFF \
  "${DB_NAME}" | gzip -9 > "${OUT_FILE}"

chmod 600 "${OUT_FILE}"
echo "[$(date -u)] Backup saved: ${OUT_FILE}"

# Prune backups older than RETENTION_DAYS
find "${BACKUP_DIR}" -type f -name "${DB_NAME}_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete
echo "[$(date -u)] Pruned backups older than ${RETENTION_DAYS} days."

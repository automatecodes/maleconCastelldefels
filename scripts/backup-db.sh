#!/usr/bin/env bash
# backup-db.sh — Backup diario de la BD de elMalecón
# Uso: ./scripts/backup-db.sh
# Crontab: 0 3 * * * /ruta/absoluta/scripts/backup-db.sh >> /var/log/malecon-backup.log 2>&1

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/data/backups"
ENV_FILE="$PROJECT_DIR/.env"
RETAIN_DAYS=30
DATE="$(date +%F-%H%M)"

# Leer variables del .env
if [ -f "$ENV_FILE" ]; then
  export $(grep -E '^(POSTGRES_USER|POSTGRES_DB)=' "$ENV_FILE" | xargs)
fi

POSTGRES_USER="${POSTGRES_USER:-malecon}"
POSTGRES_DB="${POSTGRES_DB:-malecon}"

mkdir -p "$BACKUP_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando backup de $POSTGRES_DB..."

docker exec maleconcastelldefels-db \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip > "$BACKUP_DIR/${DATE}.sql.gz"

SIZE=$(du -sh "$BACKUP_DIR/${DATE}.sql.gz" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup completado: ${DATE}.sql.gz ($SIZE)"

# Borrar backups más antiguos de RETAIN_DAYS días
find "$BACKUP_DIR" -name "*.sql.gz" -mtime "+$RETAIN_DAYS" -delete
KEPT=$(find "$BACKUP_DIR" -name "*.sql.gz" | wc -l)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backups retenidos: $KEPT (retención: ${RETAIN_DAYS} días)"

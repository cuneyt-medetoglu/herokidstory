#!/usr/bin/env bash
# HeroKidStory – Production DB backup (pg_dump) + S3 upload + retention
# Kullanım: EC2'de cron ile (örn. günlük 03:00) veya elle: ./scripts/db-backup.sh
# Gereken env: PGPASSWORD (ve isteğe bağlı PGHOST, PGUSER, PGDATABASE, AWS_S3_BUCKET, AWS_REGION)

set -e

# Varsayılanlar (EC2 production) — DB kullanıcı/veritabanı adı: herokidstory
PGHOST="${PGHOST:-localhost}"
PGUSER="${PGUSER:-herokidstory}"
PGDATABASE="${PGDATABASE:-herokidstory}"
S3_BUCKET="${AWS_S3_BUCKET:-herokidstory}"
S3_PREFIX="backups/db"
RETENTION_DAYS="${DB_BACKUP_RETENTION_DAYS:-14}"

DATE=$(date +%Y-%m-%d-%H%M)
DUMP_NAME="herokidstory-${DATE}.dump"
# Script proje kökünden veya scripts/ içinden çalıştırılabilsin
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
mkdir -p "$BACKUP_DIR"
DUMP_PATH="$BACKUP_DIR/$DUMP_NAME"

if [ -z "${PGPASSWORD}" ] && [ ! -f "${HOME}/.pgpass" ]; then
  echo "[db-backup] Hata: PGPASSWORD set edilmeli veya ~/.pgpass kullanın (cron için .pgpass önerilir)." >&2
  exit 1
fi

echo "[db-backup] pg_dump başlıyor: $PGDATABASE @ $PGHOST"
pg_dump -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -F c -f "$DUMP_PATH"
echo "[db-backup] Dump oluştu: $DUMP_PATH"

echo "[db-backup] S3'e yükleniyor: s3://$S3_BUCKET/$S3_PREFIX/$DUMP_NAME"
aws s3 cp "$DUMP_PATH" "s3://$S3_BUCKET/$S3_PREFIX/$DUMP_NAME" --region "${AWS_REGION:-eu-central-1}"
echo "[db-backup] S3 upload tamamlandı."

# Yerel dump'ı sil (isteğe bağlı; disk tasarrufu)
rm -f "$DUMP_PATH"

# S3'te retention: $RETENTION_DAYS günden eski dosyaları sil (Linux date kullanır)
echo "[db-backup] Eski yedekler temizleniyor (son $RETENTION_DAYS gün tutuluyor)..."
if command -v date &>/dev/null; then
  CUTOFF=$(date -d "-${RETENTION_DAYS} days" +%Y-%m-%d 2>/dev/null || true)
  if [ -z "$CUTOFF" ]; then
    CUTOFF=$(date -v-${RETENTION_DAYS}d +%Y-%m-%d 2>/dev/null || true)
  fi
  if [ -n "$CUTOFF" ]; then
    aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/" 2>/dev/null | while read -r line; do
      fdate=$(echo "$line" | awk '{print $1}')
      fname=$(echo "$line" | awk '{print $4}')
      if [ -n "$fname" ] && [[ "$fdate" < "$CUTOFF" ]]; then
        echo "[db-backup] Siliniyor: $fname (tarih: $fdate)"
        aws s3 rm "s3://$S3_BUCKET/$S3_PREFIX/$fname" 2>/dev/null || true
      fi
    done
  fi
fi

echo "[db-backup] Bitti: $DUMP_NAME"

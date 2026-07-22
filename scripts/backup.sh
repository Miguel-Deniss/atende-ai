#!/bin/bash
set -e

BACKUP_DIR=${BACKUP_DIR:-"./backups"}
DB_NAME=${POSTGRES_DB:-"atendeai"}
DB_USER=${POSTGRES_USER:-"atendeai"}
DB_PASS=${POSTGRES_PASSWORD:-"atendeai_secret"}
DB_HOST=${POSTGRES_HOST:-"localhost"}
DB_PORT=${POSTGRES_PORT:-"5432"}
RETENTION_DAYS=${RETENTION_DAYS:-30}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

export PGPASSWORD="${DB_PASS}"
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
  --no-owner \
  --no-acl \
  --format=c \
  --compress=9 \
  --file="${BACKUP_FILE}"

echo "Backup created: ${BACKUP_FILE}"

find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup completed successfully"

S3_BUCKET=${S3_BUCKET:-""}
if [ -n "${S3_BUCKET}" ]; then
  aws s3 cp "${BACKUP_FILE}" "s3://${S3_BUCKET}/backups/"
  echo "Backup uploaded to S3"
fi

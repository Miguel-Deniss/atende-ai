# Backup Documentation

## Overview
Automated PostgreSQL backup system with configurable retention and optional S3 upload.

## Automated Backups

### Daily Backup
- Runs at 02:00 AM via cron
- Full database dump using `pg_dump` (custom format, compressed)
- 30-day retention (older backups auto-deleted)
- Optional S3 sync

### Weekly Backup
- Runs every Sunday at 03:00 AM
- Full database dump + upload to S3 (if configured)
- 12-week retention

### Manual Backup
```bash
# Trigger backup manually
bash scripts/backup.sh

# Or using npm script
npm run db:backup
```

## Configuration

### Environment Variables
```env
# Database (from .env)
DATABASE_URL="postgresql://user:password@host:5432/atendeai?schema=public"

# Backup
BACKUP_DIR="./backups"                    # Local backup directory
RETENTION_DAYS=30                         # Days to keep local backups
S3_BUCKET="atendeai-backups"              # Optional: S3 bucket name
```

### Cron Setup (Linux)
```bash
# Daily backup at 2 AM
0 2 * * * cd /opt/atendeai && bash scripts/backup.sh >> /var/log/atendeai-backup.log 2>&1

# Weekly S3 sync at 3 AM Sunday
0 3 * * 0 cd /opt/atendeai && aws s3 sync ./backups/ s3://atendeai-backups/
```

## Restore Procedure

### Quick Restore (latest backup)
```bash
# Find latest backup
LATEST=$(ls -t backups/*.sql.gz | head -1)

# Restore
pg_restore -h localhost -U atendeai -d atendeai \
  --clean --no-owner --no-acl \
  "${LATEST}"
```

### Point-in-Time Restore
```bash
# List available backups
ls -lh backups/

# Restore specific backup
pg_restore -h localhost -U atendeai -d atendeai \
  --clean --no-owner --no-acl \
  "backups/atendeai_20241201_020000.sql.gz"
```

### Docker Restore
```bash
# Copy backup into container
docker cp backups/atendeai_20241201_020000.sql.gz atendeai-db:/tmp/

# Restore inside container
docker exec -i atendeai-db pg_restore \
  -U atendeai -d atendeai \
  --clean --no-owner --no-acl \
  /tmp/atendeai_20241201_020000.sql.gz
```

## Monitoring
- Backup logs: `/var/log/atendeai-backup.log`
- Health check verifies backup directory exists
- Failed backups are logged to the audit system

## File Structure
```
backups/
├── atendeai_20241201_020000.sql.gz     # Daily dump
├── atendeai_20241202_020000.sql.gz
└── ...
```

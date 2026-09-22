#!/bin/bash
BACKUP_DIR="/home/itadmin/gm-backups"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump gm_master 2>/dev/null | gzip > "$BACKUP_DIR/gm_master_$DATE.sql.gz"
sudo -u postgres psql gm_master -t -c "SELECT db_name FROM clients WHERE db_name IS NOT NULL;" 2>/dev/null | tr -d ' ' | grep -v '^$' | while read db; do
  sudo -u postgres pg_dump "$db" 2>/dev/null | gzip > "$BACKUP_DIR/${db}_$DATE.sql.gz"
done
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
echo "✅ Backup done: $DATE"

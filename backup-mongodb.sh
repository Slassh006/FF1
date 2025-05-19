#!/bin/bash

# Backup directory
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$DATE"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
mongodump --out $BACKUP_PATH

# Compress backup
tar -czf $BACKUP_PATH.tar.gz $BACKUP_PATH

# Remove uncompressed backup
rm -rf $BACKUP_PATH

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_PATH.tar.gz" 
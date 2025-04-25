
import { BoilerplateScript } from '@/types/scripts';

export const backupRestoreScripts: BoilerplateScript[] = [
  {
    id: "backup-directory",
    name: "Backup Directory Script",
    description: "Creates a compressed backup of a directory",
    category: "backup-restore",
    template: `#!/bin/bash

# Directory Backup Script
# Description: Creates a compressed backup of a directory
# Usage: ./backup_directory.sh [source_dir] [backup_dir]

# Set default directories
SOURCE_DIR=\${1:-"/path/to/source"}
BACKUP_DIR=\${2:-"/path/to/backups"}
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_\${DATE}.tar.gz"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo "Error: Source directory $SOURCE_DIR does not exist."
  exit 1
fi

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
  mkdir -p "$BACKUP_DIR"
fi

# Create backup
echo "Creating backup of $SOURCE_DIR..."
tar -czf "$BACKUP_DIR/$BACKUP_FILE" -C "$(dirname "$SOURCE_DIR")" "$(basename "$SOURCE_DIR")"

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "Backup completed successfully: $BACKUP_DIR/$BACKUP_FILE"
  echo "Backup size: $(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)"
else
  echo "Error: Backup failed."
  exit 1
fi

exit 0
`
  },
  {
    id: "mysql-backup",
    name: "MySQL Database Backup",
    description: "Backs up a MySQL/MariaDB database to a file",
    category: "backup-restore",
    template: `#!/bin/bash

# MySQL Database Backup Script
# Description: Creates a backup of a MySQL database
# Usage: ./mysql_backup.sh [database] [username] [password]

# MySQL credentials
DB_NAME=\${1:-"database_name"}
DB_USER=\${2:-"root"}
DB_PASS=\${3:-"password"}
BACKUP_DIR="/path/to/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/$DB_NAME-$DATE.sql"

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
  mkdir -p "$BACKUP_DIR"
fi

# Create database backup
echo "Creating backup of MySQL database: $DB_NAME..."
mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "Database backup completed successfully: $BACKUP_FILE"
  
  # Compress the backup
  gzip "$BACKUP_FILE"
  echo "Backup compressed: $BACKUP_FILE.gz"
  echo "Backup size: $(du -h "$BACKUP_FILE.gz" | cut -f1)"
else
  echo "Error: Database backup failed."
  exit 1
fi

exit 0
`
  },
  {
    id: "restore-from-backup",
    name: "Restore from Backup",
    description: "Restores files or databases from backup archives",
    category: "backup-restore",
    template: `#!/bin/bash

# Restore from Backup Script
# Description: Restores files or databases from backup archives
# Usage: ./restore_backup.sh [backup_file] [destination]

# Set backup file and destination
BACKUP_FILE=\${1:-""}
DESTINATION=\${2:-""}

# Check if backup file was provided
if [ -z "$BACKUP_FILE" ]; then
  echo "Error: No backup file specified."
  echo "Usage: $0 [backup_file] [destination]"
  exit 1
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file $BACKUP_FILE does not exist."
  exit 1
fi

# Determine file type and restore appropriately
if [[ "$BACKUP_FILE" == *.tar.gz || "$BACKUP_FILE" == *.tgz ]]; then
  # It's a tarball
  echo "Restoring from tar archive..."
  
  if [ -z "$DESTINATION" ]; then
    DESTINATION="."
  fi
  
  # Create destination if it doesn't exist
  mkdir -p "$DESTINATION"
  
  # Extract the archive
  tar -xzf "$BACKUP_FILE" -C "$DESTINATION"
  
elif [[ "$BACKUP_FILE" == *.sql || "$BACKUP_FILE" == *.sql.gz ]]; then
  # It's a SQL backup
  echo "Restoring database from SQL backup..."
  
  # Get database name from destination or prompt
  DB_NAME=$DESTINATION
  if [ -z "$DB_NAME" ]; then
    read -p "Enter database name: " DB_NAME
  fi
  
  # Get database credentials
  read -p "Enter database username: " DB_USER
  read -sp "Enter database password: " DB_PASS
  echo ""
  
  # Restore database
  if [[ "$BACKUP_FILE" == *.sql.gz ]]; then
    # Compressed SQL file
    echo "Decompressing and restoring..."
    gunzip < "$BACKUP_FILE" | mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME"
  else
    # Uncompressed SQL file
    echo "Restoring..."
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$BACKUP_FILE"
  fi
  
else
  echo "Error: Unknown backup format. Supported formats: .tar.gz, .tgz, .sql, .sql.gz"
  exit 1
fi

# Check if restore was successful
if [ $? -eq 0 ]; then
  echo "Restore completed successfully."
else
  echo "Error: Restore failed."
  exit 1
fi

exit 0
`
  }
];

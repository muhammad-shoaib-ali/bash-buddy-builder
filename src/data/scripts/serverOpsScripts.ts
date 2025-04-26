
import { BoilerplateScript } from '@/types/scripts';

export const serverOpsScripts: BoilerplateScript[] = [
  {
    id: "setup-ufw-firewall",
    name: "Setup UFW Firewall",
    description: "Configures UFW firewall with common rules",
    category: "server-ops",
    template: `#!/bin/bash

# UFW Firewall Setup Script
# Description: Configures UFW firewall with common rules for server security
# Usage: ./setup_ufw.sh [ssh_port]

SSH_PORT=\${1:-22}

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then
  echo "Error: This script must be run as root."
  echo "Please use: sudo $0"
  exit 1
fi

# Check if UFW is installed
if ! command -v ufw &> /dev/null; then
  echo "UFW is not installed. Installing..."
  apt-get update
  apt-get install -y ufw
fi

echo "Setting up UFW firewall..."

# Reset UFW to default
echo "Resetting UFW to default configuration..."
ufw --force reset

# Set default policies
echo "Setting default policies..."
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (before enabling firewall to avoid lockout)
echo "Allowing SSH on port $SSH_PORT..."
ufw allow $SSH_PORT/tcp

# Common web services
echo "Adding rules for common web services..."
ufw allow 80/tcp        # HTTP
ufw allow 443/tcp       # HTTPS

# Prompt for additional services
echo "Do you want to allow additional services?"
echo "1) MySQL (3306)"
echo "2) PostgreSQL (5432)"
echo "3) Redis (6379)"
echo "4) MongoDB (27017)"
echo "5) Mail (25, 465, 587, 993, 995)"
echo "6) Custom port"
echo "0) None/Continue"

while true; do
  read -p "Enter option (0-6): " service_option
  
  case $service_option in
    0)
      break
      ;;
    1)
      echo "Allowing MySQL (3306)..."
      ufw allow 3306/tcp
      ;;
    2)
      echo "Allowing PostgreSQL (5432)..."
      ufw allow 5432/tcp
      ;;
    3)
      echo "Allowing Redis (6379)..."
      ufw allow 6379/tcp
      ;;
    4)
      echo "Allowing MongoDB (27017)..."
      ufw allow 27017/tcp
      ;;
    5)
      echo "Allowing Mail services..."
      ufw allow 25/tcp
      ufw allow 465/tcp
      ufw allow 587/tcp
      ufw allow 993/tcp
      ufw allow 995/tcp
      ;;
    6)
      read -p "Enter custom port: " custom_port
      read -p "Protocol (tcp/udp/both): " custom_protocol
      
      if [ "$custom_protocol" = "both" ]; then
        echo "Allowing port $custom_port (TCP & UDP)..."
        ufw allow $custom_port
      else
        echo "Allowing port $custom_port ($custom_protocol)..."
        ufw allow $custom_port/$custom_protocol
      fi
      ;;
    *)
      echo "Invalid option."
      ;;
  esac
done

# Enable UFW
echo "Enabling UFW..."
ufw --force enable

# Show status
echo "UFW configuration complete. Current status:"
ufw status verbose

echo "Firewall setup completed successfully!"
exit 0`
  },
  {
    id: "rotate-system-logs",
    name: "Rotate & Archive System Logs",
    description: "Rotates and archives system logs to prevent disk filling",
    category: "server-ops",
    template: `#!/bin/bash

# Log Rotation and Archiving Script
# Description: Rotates and archives system logs to save disk space
# Usage: ./rotate_logs.sh [log_dir] [archive_dir] [days_to_keep]

LOG_DIR=\${1:-"/var/log"}
ARCHIVE_DIR=\${2:-"/var/archive/logs"}
DAYS_TO_KEEP=\${3:-30}
DATE=$(date +"%Y%m%d")

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then
  echo "Warning: This script may need root privileges to access all logs."
  echo "Consider running as: sudo $0"
fi

# Create archive directory if it doesn't exist
if [ ! -d "$ARCHIVE_DIR" ]; then
  mkdir -p "$ARCHIVE_DIR"
  echo "Created archive directory: $ARCHIVE_DIR"
fi

echo "Starting log rotation and archiving..."
echo "Log directory: $LOG_DIR"
echo "Archive directory: $ARCHIVE_DIR"
echo "Days to keep archived logs: $DAYS_TO_KEEP"

# Rotate and compress log files larger than 100MB
echo "Finding large log files (>100MB)..."
find "$LOG_DIR" -type f -name "*.log" -size +100M | while read -r logfile; do
  basename=$(basename "$logfile")
  echo "Rotating: $logfile"
  
  # Create archive filename
  archive_file="$ARCHIVE_DIR/${basename%.log}_$DATE.log.gz"
  
  # Compress the log file
  cat "$logfile" | gzip > "$archive_file"
  
  # Verify compression was successful
  if [ -f "$archive_file" ]; then
    echo "  Compressed to: $archive_file"
    echo "  Original size: $(du -h "$logfile" | cut -f1)"
    echo "  Compressed size: $(du -h "$archive_file" | cut -f1)"
    
    # Clear original log file
    cat /dev/null > "$logfile"
    echo "  Original log file cleared."
  else
    echo "  Error: Failed to compress log file."
  fi
done

# Delete old archive files
echo "Removing log archives older than $DAYS_TO_KEEP days..."
find "$ARCHIVE_DIR" -type f -name "*.gz" -mtime +$DAYS_TO_KEEP -delete -print

echo "Log rotation and archiving completed."
exit 0`
  },
  {
    id: "db-backup",
    name: "Database Backup (MySQL/PostgreSQL)",
    description: "Creates backups of MySQL or PostgreSQL databases",
    category: "server-ops",
    template: `#!/bin/bash

# Database Backup Script
# Description: Creates backups of MySQL or PostgreSQL databases
# Usage: ./db_backup.sh [db_type] [db_name] [username] [password] [backup_dir]

DB_TYPE=\${1:-"mysql"}   # mysql or postgres
DB_NAME=\${2:-"database_name"}
DB_USER=\${3:-"db_user"}
DB_PASS=\${4:-"db_password"}
BACKUP_DIR=\${5:-"/var/backups/databases"}
DATE=$(date +"%Y%m%d_%H%M%S")

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
  mkdir -p "$BACKUP_DIR"
  echo "Created backup directory: $BACKUP_DIR"
fi

# Validate database type
if [ "$DB_TYPE" != "mysql" ] && [ "$DB_TYPE" != "postgres" ]; then
  echo "Error: Invalid database type. Use 'mysql' or 'postgres'."
  exit 1
fi

case "$DB_TYPE" in
  mysql)
    # Check if MySQL client is installed
    if ! command -v mysql &> /dev/null; then
      echo "Error: MySQL client is not installed."
      exit 1
    fi
    
    BACKUP_FILE="$BACKUP_DIR/mysql_${DB_NAME}_$DATE.sql.gz"
    echo "Creating MySQL backup of database '$DB_NAME'..."
    
    # Create the MySQL backup
    mysqldump --user="$DB_USER" --password="$DB_PASS" --single-transaction --quick --lock-tables=false "$DB_NAME" | gzip > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
      echo "MySQL backup completed successfully."
      echo "Backup file: $BACKUP_FILE"
      echo "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
    else
      echo "Error: MySQL backup failed."
      exit 1
    fi
    ;;
    
  postgres)
    # Check if PostgreSQL client is installed
    if ! command -v pg_dump &> /dev/null; then
      echo "Error: PostgreSQL client is not installed."
      exit 1
    fi
    
    BACKUP_FILE="$BACKUP_DIR/postgres_${DB_NAME}_$DATE.sql.gz"
    echo "Creating PostgreSQL backup of database '$DB_NAME'..."
    
    # Set PostgreSQL environment variables
    export PGUSER="$DB_USER"
    export PGPASSWORD="$DB_PASS"
    
    # Create the PostgreSQL backup
    pg_dump -c "$DB_NAME" | gzip > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
      echo "PostgreSQL backup completed successfully."
      echo "Backup file: $BACKUP_FILE"
      echo "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
    else
      echo "Error: PostgreSQL backup failed."
      exit 1
    fi
    ;;
esac

# Clean up old backups (keep last 30 days by default)
echo "Cleaning up old backups (keeping the last 30 days)..."
find "$BACKUP_DIR" -name "${DB_TYPE}_${DB_NAME}_*.sql.gz" -mtime +30 -delete

echo "Database backup process completed."
exit 0`
  },
  {
    id: "ssl-cert-check",
    name: "Check SSL Certificate Expiry",
    description: "Checks SSL certificate expiration dates and sends alerts",
    category: "server-ops",
    template: `#!/bin/bash

# SSL Certificate Expiry Checker
# Description: Checks SSL certificate expiration dates and sends alerts
# Usage: ./ssl_cert_check.sh [domain] [alert_days] [email]

DOMAIN=\${1:-"example.com"}
ALERT_DAYS=\${2:-30}   # Alert if expiring within this many days
EMAIL=\${3:-"admin@example.com"}

# Check if openssl is installed
if ! command -v openssl &> /dev/null; then
  echo "Error: OpenSSL is not installed."
  exit 1
fi

echo "Checking SSL certificate for domain: $DOMAIN"
echo "Will alert if expiring within $ALERT_DAYS days"

# Get the certificate expiration date
CERT_INFO=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN":443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null)

if [ -z "$CERT_INFO" ]; then
  echo "Error: Could not retrieve SSL certificate for $DOMAIN."
  exit 1
fi

# Extract the expiry date
EXPIRY_DATE=$(echo "$CERT_INFO" | sed -n 's/notAfter=//p')
echo "Certificate expiry date: $EXPIRY_DATE"

# Convert dates to seconds since epoch
EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_EPOCH=$(date +%s)
NOW_DATE=$(date)

# Calculate days until expiry
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))

echo "Days remaining until certificate expiry: $DAYS_LEFT"

# Check if certificate is already expired
if [ $DAYS_LEFT -lt 0 ]; then
  echo "⚠️ WARNING: SSL Certificate for $DOMAIN has EXPIRED!"
  
  # Send email alert
  if [ -n "$EMAIL" ]; then
    echo "Sending expiry alert to $EMAIL..."
    mail -s "CRITICAL: SSL Certificate EXPIRED for $DOMAIN" "$EMAIL" << EOF
WARNING: The SSL certificate for $DOMAIN has EXPIRED!

Domain: $DOMAIN
Expiry date: $EXPIRY_DATE
Current date: $NOW_DATE

Please renew the SSL certificate immediately.
EOF
  fi
  
  exit 2
  
# Check if certificate is expiring soon
elif [ $DAYS_LEFT -lt "$ALERT_DAYS" ]; then
  echo "⚠️ WARNING: SSL Certificate for $DOMAIN expires in $DAYS_LEFT days!"
  
  # Send email alert
  if [ -n "$EMAIL" ]; then
    echo "Sending expiry alert to $EMAIL..."
    mail -s "WARNING: SSL Certificate expiring soon for $DOMAIN" "$EMAIL" << EOF
WARNING: The SSL certificate for $DOMAIN will expire in $DAYS_LEFT days!

Domain: $DOMAIN
Expiry date: $EXPIRY_DATE
Current date: $NOW_DATE
Days remaining: $DAYS_LEFT

Please renew the SSL certificate before it expires.
EOF
  fi
  
  exit 1
  
else
  echo "✅ SSL Certificate for $DOMAIN is valid for $DAYS_LEFT more days."
  exit 0
fi`
  },
  {
    id: "auto-process-restart",
    name: "Auto-Monitor & Restart Process",
    description: "Monitors a process and restarts it if it crashes",
    category: "server-ops",
    template: `#!/bin/bash

# Process Monitor and Auto-Restart Script
# Description: Monitors a process and automatically restarts it if it crashes
# Usage: ./monitor_process.sh [process_name] [restart_command] [check_interval]

PROCESS_NAME=\${1:-""}
RESTART_CMD=\${2:-""}
CHECK_INTERVAL=\${3:-60}  # Seconds between checks

# Check if process name and restart command are provided
if [ -z "$PROCESS_NAME" ] || [ -z "$RESTART_CMD" ]; then
  echo "Error: Process name and restart command are required."
  echo "Usage: $0 [process_name] [restart_command] [check_interval]"
  echo "Example: $0 nginx 'systemctl restart nginx' 60"
  exit 1
fi

echo "Starting process monitor for: $PROCESS_NAME"
echo "Restart command: $RESTART_CMD"
echo "Check interval: $CHECK_INTERVAL seconds"
echo "Press Ctrl+C to exit."
echo "-------------------------------------------"

# Set up a log file
LOG_FILE="/tmp/process_monitor_${PROCESS_NAME//[^a-zA-Z0-9]/_}.log"
echo "Logging to: $LOG_FILE"

# Function to check if process is running
is_process_running() {
  pgrep -x "$PROCESS_NAME" > /dev/null || pgrep -f "$PROCESS_NAME" > /dev/null
  return $?
}

# Function to restart the process
restart_process() {
  echo "[$(date)] Process $PROCESS_NAME is DOWN. Restarting..." | tee -a "$LOG_FILE"
  
  # Execute the restart command
  eval "$RESTART_CMD" >> "$LOG_FILE" 2>&1
  
  # Check if restart was successful
  sleep 5
  if is_process_running; then
    echo "[$(date)] Process $PROCESS_NAME successfully restarted." | tee -a "$LOG_FILE"
    return 0
  else
    echo "[$(date)] Failed to restart process $PROCESS_NAME!" | tee -a "$LOG_FILE"
    return 1
  fi
}

# Main monitoring loop
while true; do
  if is_process_running; then
    echo "[$(date)] Process $PROCESS_NAME is running."
  else
    restart_process
  fi
  
  sleep "$CHECK_INTERVAL"
done`
  }
];

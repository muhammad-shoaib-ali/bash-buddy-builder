
import { ScriptCategory, BoilerplateScript } from '@/types/scripts';

export const SCRIPT_CATEGORIES: ScriptCategory[] = [
  {
    id: "system-admin",
    name: "System & Network Administration",
    scripts: [
      {
        id: "system-update",
        name: "System Update Script",
        description: "Automatically updates and upgrades system packages",
        category: "system-admin",
        template: `#!/bin/bash

# System Update Script
# Description: Updates and upgrades system packages
# Usage: ./system_update.sh

echo "Starting system update..."

# Update package lists
apt-get update

# Upgrade installed packages
apt-get upgrade -y

# Perform distribution upgrade
apt-get dist-upgrade -y

# Clean up
apt-get autoremove -y
apt-get autoclean

echo "System update completed successfully!"
`
      },
      {
        id: "disk-space-check",
        name: "Disk Space Check",
        description: "Monitors disk usage and sends alerts if usage exceeds a threshold",
        category: "system-admin",
        template: `#!/bin/bash

# Disk Space Check Script
# Description: Monitors disk usage and alerts if threshold is exceeded
# Usage: ./disk_space_check.sh [threshold_percent]

# Set the threshold (default: 90%)
THRESHOLD=\${1:-90}

# Get disk usage information
DISK_USAGE=$(df -h / | grep -v Filesystem | awk '{print $5}' | tr -d '%')

echo "Current disk usage: $DISK_USAGE%"

# Check if disk usage exceeds threshold
if [ "$DISK_USAGE" -gt "$THRESHOLD" ]; then
  echo "WARNING: Disk usage is above threshold!"
  echo "Disk usage: $DISK_USAGE% (Threshold: $THRESHOLD%)"
  
  # You can add notification commands here (e.g., send email)
  # mail -s "Disk Space Alert" admin@example.com << EOF
  # Disk usage is above threshold!
  # Usage: $DISK_USAGE% (Threshold: $THRESHOLD%)
  # EOF
  
  exit 1
else
  echo "Disk usage is below threshold ($THRESHOLD%)."
  exit 0
fi
`
      },
      {
        id: "create-swap",
        name: "Create Swap File",
        description: "Adds swap space to the system to handle memory issues",
        category: "system-admin",
        template: `#!/bin/bash

# Create Swap File Script
# Description: Creates and enables a swap file
# Usage: ./create_swap.sh [swap_size_in_gb]

# Set swap size (default: 2GB)
SWAP_SIZE=\${1:-2}

echo "Creating $SWAP_SIZE GB swap file..."

# Create swap file
sudo fallocate -l "$SWAP_SIZE"G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify swap is enabled
echo "Swap status:"
sudo swapon --show

echo "Swap file created and enabled successfully!"
`
      },
      {
        id: "static-ip",
        name: "Configure Static IP",
        description: "Configures a static IP for the server",
        category: "system-admin",
        template: `#!/bin/bash

# Configure Static IP Script
# Description: Sets up a static IP address for the server
# Usage: ./configure_static_ip.sh [ip_address] [subnet_mask] [gateway]

# Default values (replace with your network settings)
IP_ADDRESS=\${1:-"192.168.1.100"}
SUBNET_MASK=\${2:-"255.255.255.0"}
GATEWAY=\${3:-"192.168.1.1"}
INTERFACE="eth0"  # Change to your network interface (e.g., eth0, ens33)

echo "Configuring static IP: $IP_ADDRESS"

# Backup the existing network configuration
sudo cp /etc/network/interfaces /etc/network/interfaces.bak

# Create new network configuration
cat > /tmp/interfaces << EOF
# This file describes the network interfaces available on your system
# and how to activate them. For more information, see interfaces(5).

source /etc/network/interfaces.d/*

# The loopback network interface
auto lo
iface lo inet loopback

# The primary network interface
auto $INTERFACE
iface $INTERFACE inet static
    address $IP_ADDRESS
    netmask $SUBNET_MASK
    gateway $GATEWAY
    dns-nameservers 8.8.8.8 8.8.4.4
EOF

# Apply the new configuration
sudo cp /tmp/interfaces /etc/network/interfaces
sudo rm /tmp/interfaces

echo "Static IP configuration complete."
echo "Restart networking service with: sudo systemctl restart networking"
`
      },
      {
        id: "service-restart",
        name: "Service Restart Script",
        description: "Automatically restarts a service if it's down",
        category: "system-admin",
        template: `#!/bin/bash

# Service Restart Script
# Description: Checks if a service is running and restarts it if needed
# Usage: ./service_restart.sh [service_name]

SERVICE_NAME=\${1:-"nginx"}

echo "Checking status of $SERVICE_NAME service..."

# Check if the service is running
if systemctl is-active --quiet $SERVICE_NAME; then
  echo "$SERVICE_NAME service is running."
else
  echo "$SERVICE_NAME service is down. Restarting..."
  systemctl restart $SERVICE_NAME
  
  # Check if restart was successful
  if systemctl is-active --quiet $SERVICE_NAME; then
    echo "$SERVICE_NAME service restarted successfully."
  else
    echo "Failed to restart $SERVICE_NAME service. Manual intervention required."
    exit 1
  fi
fi

exit 0
`
      }
    ]
  },
  {
    id: "user-management",
    name: "User Management",
    scripts: [
      {
        id: "create-user-sudo",
        name: "Create User with Sudo Privileges",
        description: "Adds a new user to the system and grants sudo privileges",
        category: "user-management",
        template: `#!/bin/bash

# Create User with Sudo Privileges Script
# Description: Creates a new user and adds them to the sudo group
# Usage: ./create_sudo_user.sh [username] [password]

# Check if the script is running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run this script as root or with sudo"
  exit 1
fi

# Get username and password
USERNAME=\${1:-"newuser"}
PASSWORD=\${2:-"password"}  # It's better to prompt for password rather than passing as argument

echo "Creating user: $USERNAME"

# Create the user
useradd -m -s /bin/bash $USERNAME

# Set the password
echo "$USERNAME:$PASSWORD" | chpasswd

# Add user to sudo group
usermod -aG sudo $USERNAME

# Verify the user was created
if id "$USERNAME" >/dev/null 2>&1; then
  echo "User $USERNAME created successfully and added to sudo group."
else
  echo "Failed to create user $USERNAME."
  exit 1
fi

exit 0
`
      },
      {
        id: "delete-user",
        name: "Delete User Script",
        description: "Removes a user from the system and deletes the home directory",
        category: "user-management",
        template: `#!/bin/bash

# Delete User Script
# Description: Removes a user and their home directory
# Usage: ./delete_user.sh [username]

# Check if the script is running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run this script as root or with sudo"
  exit 1
fi

# Get username
USERNAME=\${1:-"username"}

# Check if the user exists
if id "$USERNAME" >/dev/null 2>&1; then
  echo "Deleting user: $USERNAME"
  
  # Delete the user and their home directory
  deluser --remove-home $USERNAME
  
  echo "User $USERNAME has been deleted along with their home directory."
else
  echo "User $USERNAME does not exist."
  exit 1
fi

exit 0
`
      },
      {
        id: "add-ssh-key",
        name: "Add SSH Key to User's Authorized Keys",
        description: "Automatically adds an SSH key to a user's authorized keys",
        category: "user-management",
        template: `#!/bin/bash

# Add SSH Key to Authorized Keys Script
# Description: Adds an SSH public key to a user's authorized_keys file
# Usage: ./add_ssh_key.sh [username] [ssh_public_key]

# Get username
USERNAME=\${1:-"$(whoami)"}
SSH_KEY=\${2:-"ssh-rsa YOUR_SSH_KEY user@example.com"}

# Check if the user exists
if ! id "$USERNAME" >/dev/null 2>&1; then
  echo "Error: User $USERNAME does not exist."
  exit 1
fi

# Get the user's home directory
USER_HOME=$(eval echo ~$USERNAME)

# Create .ssh directory if it doesn't exist
SSH_DIR="$USER_HOME/.ssh"
if [ ! -d "$SSH_DIR" ]; then
  mkdir -p "$SSH_DIR"
  chown $USERNAME:$USERNAME "$SSH_DIR"
  chmod 700 "$SSH_DIR"
fi

# Create or append to authorized_keys file
AUTH_KEYS="$SSH_DIR/authorized_keys"
echo "$SSH_KEY" >> "$AUTH_KEYS"

# Set proper permissions
chown $USERNAME:$USERNAME "$AUTH_KEYS"
chmod 600 "$AUTH_KEYS"

echo "SSH key added to $USERNAME's authorized_keys file."
exit 0
`
      },
      {
        id: "list-users",
        name: "List All Users",
        description: "Outputs a list of all users on the system",
        category: "user-management",
        template: `#!/bin/bash

# List All Users Script
# Description: Displays all users on the system
# Usage: ./list_users.sh

echo "Listing all users with UID >= 1000 (standard users):"
echo "---------------------------------------------------"
awk -F: '$3 >= 1000 && $3 != 65534 {print $1}' /etc/passwd

echo -e "\nListing system users (UID < 1000):"
echo "-----------------------------------"
awk -F: '$3 < 1000 {print $1}' /etc/passwd

echo -e "\nListing users with shell access:"
echo "--------------------------------"
grep -v '/nologin\|/false' /etc/passwd | cut -d: -f1

echo -e "\nUsers currently logged in:"
echo "---------------------------"
who | cut -d' ' -f1 | sort | uniq
`
      }
    ]
  },
  {
    id: "backup-restore",
    name: "Backup & Restore",
    scripts: [
      {
        id: "backup-directory",
        name: "Backup Directory Script",
        description: "Creates a backup of a directory and stores it in a specified location",
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
        description: "Backs up a MySQL database and saves it as an SQL file",
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
BACKUP_FILE="$DB_NAME-$DATE.sql"

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
  mkdir -p "$BACKUP_DIR"
fi

# Create database backup
echo "Creating backup of MySQL database: $DB_NAME..."
mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_DIR/$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "Database backup completed successfully: $BACKUP_DIR/$BACKUP_FILE"
  
  # Compress the backup
  gzip "$BACKUP_DIR/$BACKUP_FILE"
  echo "Backup compressed: $BACKUP_DIR/$BACKUP_FILE.gz"
  echo "Backup size: $(du -h "$BACKUP_DIR/$BACKUP_FILE.gz" | cut -f1)"
else
  echo "Error: Database backup failed."
  exit 1
fi

exit 0
`
      },
      {
        id: "backup-scheduler",
        name: "Automated Backup Scheduler (Cron Job)",
        description: "Schedules a cron job to run the backup script periodically",
        category: "backup-restore",
        template: `#!/bin/bash

# Backup Scheduler Script
# Description: Sets up a cron job to run backups automatically
# Usage: ./backup_scheduler.sh [backup_script_path] [schedule]

BACKUP_SCRIPT=\${1:-"/path/to/backup_script.sh"}
SCHEDULE=\${2:-"0 2 * * *"}  # Default: Run at 2:00 AM daily

# Check if the backup script exists and is executable
if [ ! -x "$BACKUP_SCRIPT" ]; then
  echo "Error: Backup script $BACKUP_SCRIPT does not exist or is not executable."
  echo "Please provide a valid path to the backup script."
  exit 1
fi

# Create a temporary file for the new crontab
TEMP_CRON=$(mktemp)

# Export current crontab to the temporary file
crontab -l > "$TEMP_CRON" 2>/dev/null

# Check if the backup script is already scheduled
if grep -q "$BACKUP_SCRIPT" "$TEMP_CRON"; then
  echo "Backup script is already scheduled in crontab. Updating schedule..."
  sed -i "/$BACKUP_SCRIPT/d" "$TEMP_CRON"
fi

# Add the new cron job
echo "$SCHEDULE $BACKUP_SCRIPT" >> "$TEMP_CRON"

# Load the new crontab
crontab "$TEMP_CRON"

# Clean up the temporary file
rm "$TEMP_CRON"

echo "Backup scheduled successfully:"
echo "Script: $BACKUP_SCRIPT"
echo "Schedule: $SCHEDULE"
echo "To view scheduled cron jobs, run: crontab -l"

exit 0
`
      },
      {
        id: "restore-backup",
        name: "Restore From Backup",
        description: "Restores a directory or MySQL database from a backup",
        category: "backup-restore",
        template: `#!/bin/bash

# Restore From Backup Script
# Description: Restores a directory or database from a backup
# Usage: ./restore_backup.sh [backup_file] [destination_dir]

BACKUP_FILE=\${1:-""}
DEST_DIR=\${2:-""}

# Check if backup file was provided
if [ -z "$BACKUP_FILE" ]; then
  echo "Error: Please provide a backup file to restore."
  exit 1
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file $BACKUP_FILE does not exist."
  exit 1
fi

# Determine the type of backup based on file extension
if [[ "$BACKUP_FILE" == *.tar.gz ]]; then
  # Directory backup
  if [ -z "$DEST_DIR" ]; then
    echo "Error: Please provide a destination directory for restoration."
    exit 1
  fi
  
  # Create destination directory if it doesn't exist
  if [ ! -d "$DEST_DIR" ]; then
    mkdir -p "$DEST_DIR"
  fi
  
  echo "Restoring directory backup from $BACKUP_FILE to $DEST_DIR..."
  tar -xzf "$BACKUP_FILE" -C "$DEST_DIR"
  
elif [[ "$BACKUP_FILE" == *.sql.gz ]]; then
  # MySQL database backup (gzipped)
  echo "Restoring MySQL database backup from $BACKUP_FILE..."
  
  # Extract database name from filename (assuming format: dbname-date.sql.gz)
  DB_NAME=$(basename "$BACKUP_FILE" | sed 's/-[0-9]\\{8\\}_[0-9]\\{6\\}.sql.gz$//')
  
  read -p "Enter MySQL username: " DB_USER
  read -sp "Enter MySQL password: " DB_PASS
  echo
  
  # Restore database
  gunzip < "$BACKUP_FILE" | mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME"

elif [[ "$BACKUP_FILE" == *.sql ]]; then
  # MySQL database backup (uncompressed)
  echo "Restoring MySQL database backup from $BACKUP_FILE..."
  
  # Extract database name from filename (assuming format: dbname-date.sql)
  DB_NAME=$(basename "$BACKUP_FILE" | sed 's/-[0-9]\\{8\\}_[0-9]\\{6\\}.sql$//')
  
  read -p "Enter MySQL username: " DB_USER
  read -sp "Enter MySQL password: " DB_PASS
  echo
  
  # Restore database
  mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$BACKUP_FILE"
  
else
  echo "Error: Unsupported backup file format. Supported formats: tar.gz, sql.gz, sql"
  exit 1
fi

# Check if restoration was successful
if [ $? -eq 0 ]; then
  echo "Restoration completed successfully."
else
  echo "Error: Restoration failed."
  exit 1
fi

exit 0
`
      }
    ]
  },
  {
    id: "monitoring",
    name: "Monitoring & Alerts",
    scripts: [
      // Add monitoring scripts here similarly
      {
        id: "disk-usage-alert",
        name: "Disk Usage Alert",
        description: "Monitors disk space and sends an email alert if space exceeds a threshold",
        category: "monitoring",
        template: `#!/bin/bash

# Disk Usage Alert Script
# Description: Monitors disk usage and sends an email if threshold exceeded
# Usage: ./disk_usage_alert.sh [threshold_percent] [email_address]

# Configuration
THRESHOLD=\${1:-90}  # Default threshold: 90%
EMAIL=\${2:-"admin@example.com"}  # Email to send alerts to

# Get disk usage for the root partition
USAGE=$(df -h / | grep -v Filesystem | awk '{print $5}' | tr -d '%')

echo "Current disk usage: $USAGE%"

# Check if usage exceeds threshold
if [ "$USAGE" -gt "$THRESHOLD" ]; then
  echo "Disk usage warning: $USAGE% exceeds threshold of $THRESHOLD%"
  
  # Prepare email content
  SUBJECT="Disk Space Alert: Server $(hostname)"
  BODY="Warning: Disk usage on server $(hostname) has reached $USAGE%, which exceeds the threshold of $THRESHOLD%.\\n\\n"
  BODY+="Disk usage details:\\n"
  BODY+="$(df -h)\\n\\n"
  BODY+="Please take appropriate action to free up disk space.\\n"
  
  # Send email alert
  echo -e "$BODY" | mail -s "$SUBJECT" "$EMAIL"
  
  echo "Alert email sent to $EMAIL"
  exit 1
else
  echo "Disk usage is below threshold ($THRESHOLD%)."
  exit 0
fi
`
      }
    ]
  },
  // Add more categories and scripts following the same pattern
  {
    id: "cron-jobs",
    name: "Cron Jobs & Scheduling",
    scripts: [
      // Cron job scripts
    ]
  },
  {
    id: "networking",
    name: "Networking & Firewall",
    scripts: [
      // Networking scripts
    ]
  },
  {
    id: "security",
    name: "Security & Updates",
    scripts: [
      // Security scripts
    ]
  },
  {
    id: "docker",
    name: "Docker & Container Management",
    scripts: [
      // Docker scripts
    ]
  },
  {
    id: "cloud",
    name: "Cloud Infrastructure",
    scripts: [
      // Cloud scripts
    ]
  },
  {
    id: "miscellaneous",
    name: "Miscellaneous",
    scripts: [
      // Miscellaneous scripts
    ]
  }
];

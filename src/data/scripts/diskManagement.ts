
import { BoilerplateScript } from '@/types/scripts';

export const diskManagementScripts: BoilerplateScript[] = [
  {
    id: "monitor-disk-space",
    name: "Monitor Disk Space & Send Alert",
    description: "Monitors disk space and sends an alert when threshold is reached",
    category: "disk-management",
    template: `#!/bin/bash

# Disk Space Monitoring Script
# Description: Monitors disk space and sends an alert when usage exceeds threshold
# Usage: ./monitor_disk_space.sh [threshold_percent] [email]

# Set threshold (default: 90%)
THRESHOLD=\${1:-90}
EMAIL=\${2:-"admin@example.com"}

# Get disk usage for root partition
USAGE=$(df -h / | grep -v Filesystem | awk '{print $5}' | tr -d '%')

echo "Current disk usage: $USAGE%"

if [ "$USAGE" -gt "$THRESHOLD" ]; then
  echo "WARNING: Disk usage ($USAGE%) has exceeded threshold ($THRESHOLD%)"
  
  # Compose email message
  MESSAGE="WARNING: Disk usage on $(hostname) has reached $USAGE%, exceeding the $THRESHOLD% threshold.
  
$(df -h)

Please take action to free up disk space."

  # Send email alert (uncomment and configure for your environment)
  # echo "$MESSAGE" | mail -s "Disk Space Alert: $(hostname)" $EMAIL
  
  echo "Alert would be sent to: $EMAIL"
  exit 1
else
  echo "Disk usage is below threshold ($THRESHOLD%)."
  exit 0
fi
`
  },
  {
    id: "check-inode-usage",
    name: "Check Inode Usage",
    description: "Checks inode usage across filesystems",
    category: "disk-management",
    template: `#!/bin/bash

# Inode Usage Check Script
# Description: Checks inode usage across all filesystems
# Usage: ./check_inode_usage.sh [threshold_percent]

# Set threshold (default: 90%)
THRESHOLD=\${1:-90}

echo "Checking inode usage across all filesystems..."
echo "Threshold: $THRESHOLD%"
echo "-----------------------------------------"

# Get all mounted filesystems
FILESYSTEMS=$(df -i | grep -v "Filesystem" | awk '{print $1}')

# Check each filesystem
for FS in $FILESYSTEMS; do
  USAGE=$(df -i | grep "$FS" | awk '{print $5}' | tr -d '%')
  FS_NAME=$(df -i | grep "$FS" | awk '{print $1}')
  
  if [ "$USAGE" -gt "$THRESHOLD" ]; then
    echo "WARNING: $FS_NAME inode usage is $USAGE% (exceeds threshold)"
  else
    echo "$FS_NAME inode usage is $USAGE% (OK)"
  fi
done

echo "-----------------------------------------"
echo "Inode usage check completed."
exit 0
`
  },
  {
    id: "clean-tmp-directories",
    name: "Clean /tmp and /var/tmp",
    description: "Safely removes old files from temporary directories",
    category: "disk-management",
    template: `#!/bin/bash

# Clean Temporary Directories Script
# Description: Removes files older than X days from /tmp and /var/tmp
# Usage: ./clean_tmp.sh [days]

# Set how many days old files must be to delete (default: 7 days)
DAYS=\${1:-7}

echo "Cleaning temporary directories..."
echo "Removing files older than $DAYS days"

# Clean /tmp
echo "Cleaning /tmp directory..."
find /tmp -type f -atime +$DAYS -delete
find /tmp -type d -empty -delete

# Clean /var/tmp
echo "Cleaning /var/tmp directory..."
find /var/tmp -type f -atime +$DAYS -delete
find /var/tmp -type d -empty -delete

echo "Temporary directories cleaned successfully."
exit 0
`
  }
];


import { BoilerplateScript } from '@/types/scripts';

export const cronJobsScripts: BoilerplateScript[] = [
  {
    id: "add-cron-job",
    name: "Add Cron Entry",
    description: "Creates a new cron job for a user",
    category: "cron-jobs",
    template: `#!/bin/bash

# Add Cron Job Script
# Description: Creates a new cron job for a specified user
# Usage: ./add_cron_job.sh [user] [schedule] [command]

# Set parameters
USER=\${1:-"$(whoami)"}
SCHEDULE=\${2:-"0 2 * * *"}  # Default: 2 AM daily
COMMAND=\${3:-"/path/to/script.sh"}

echo "Adding cron job for user: $USER"
echo "Schedule: $SCHEDULE"
echo "Command: $COMMAND"

# Create a temporary file for the crontab
TEMP_CRON=$(mktemp)

# Export current crontab to the temporary file
crontab -u "$USER" -l > "$TEMP_CRON" 2>/dev/null || echo "# New crontab for $USER" > "$TEMP_CRON"

# Check if the job already exists
if grep -F "$COMMAND" "$TEMP_CRON" > /dev/null; then
  echo "Error: Cron job for this command already exists."
  rm "$TEMP_CRON"
  exit 1
fi

# Add the new cron job
echo "$SCHEDULE $COMMAND" >> "$TEMP_CRON"

# Install the new crontab
crontab -u "$USER" "$TEMP_CRON"

# Clean up the temporary file
rm "$TEMP_CRON"

echo "Cron job added successfully for user $USER."
echo "To view crontab, run: crontab -l"
exit 0
`
  },
  {
    id: "remove-cron-job",
    name: "Remove Cron Entry",
    description: "Removes a specific cron job for a user",
    category: "cron-jobs",
    template: `#!/bin/bash

# Remove Cron Job Script
# Description: Removes a specific cron job for a user
# Usage: ./remove_cron_job.sh [user] [command_pattern]

# Set parameters
USER=\${1:-"$(whoami)"}
PATTERN=\${2:-""}

if [ -z "$PATTERN" ]; then
  echo "Error: No command pattern specified."
  echo "Usage: $0 [user] [command_pattern]"
  exit 1
fi

echo "Removing cron job for user: $USER"
echo "Command pattern: $PATTERN"

# Create a temporary file for the crontab
TEMP_CRON=$(mktemp)

# Export current crontab to the temporary file
if ! crontab -u "$USER" -l > "$TEMP_CRON" 2>/dev/null; then
  echo "Error: No crontab found for user $USER."
  rm "$TEMP_CRON"
  exit 1
fi

# Count matching lines
MATCHES=$(grep -c "$PATTERN" "$TEMP_CRON")

if [ "$MATCHES" -eq 0 ]; then
  echo "No matching cron jobs found."
  rm "$TEMP_CRON"
  exit 1
fi

# Remove matching lines
grep -v "$PATTERN" "$TEMP_CRON" > "\${TEMP_CRON}.new"
mv "\${TEMP_CRON}.new" "$TEMP_CRON"

# Install the new crontab
crontab -u "$USER" "$TEMP_CRON"

# Clean up the temporary file
rm "$TEMP_CRON"

echo "$MATCHES cron job(s) removed successfully for user $USER."
echo "To verify, run: crontab -l"
exit 0
`
  },
  {
    id: "list-crontabs",
    name: "List User Crontabs",
    description: "Shows crontabs for all or specific users",
    category: "cron-jobs",
    template: `#!/bin/bash

# List User Crontabs Script
# Description: Lists crontabs for all or specific users
# Usage: ./list_crontabs.sh [user]

# Check if a specific user was specified
USER=$1

if [ -n "$USER" ]; then
  echo "Listing crontab for user: $USER"
  crontab -u "$USER" -l 2>/dev/null
  
  if [ $? -ne 0 ]; then
    echo "No crontab found for user $USER."
    exit 1
  fi
else
  echo "Listing crontabs for all users..."
  
  # Check if we have permission to access /var/spool/cron
  if [ -d /var/spool/cron/crontabs ] && [ -r /var/spool/cron/crontabs ]; then
    CRONTAB_DIR="/var/spool/cron/crontabs"
  elif [ -d /var/spool/cron ] && [ -r /var/spool/cron ]; then
    CRONTAB_DIR="/var/spool/cron"
  else
    echo "Error: Cannot access crontab directory. Try running as root."
    exit 1
  fi
  
  # List all users with crontabs
  for CRONTAB in "$CRONTAB_DIR"/*; do
    if [ -f "$CRONTAB" ]; then
      USERNAME=$(basename "$CRONTAB")
      echo "--- Crontab for user: $USERNAME ---"
      crontab -u "$USERNAME" -l 2>/dev/null
      echo ""
    fi
  done
fi

exit 0
`
  }
];

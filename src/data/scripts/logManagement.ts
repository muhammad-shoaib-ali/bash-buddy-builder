
import { BoilerplateScript } from '@/types/scripts';

export const logManagementScripts: BoilerplateScript[] = [
  {
    id: "tail-logs-realtime",
    name: "Tail Logs in Real-time",
    description: "Monitors multiple log files in real-time",
    category: "log-management",
    template: `#!/bin/bash

# Real-time Log Monitoring Script
# Description: Monitors multiple log files in real-time
# Usage: ./tail_logs.sh [log_file1] [log_file2] ...

# Default logs to monitor
LOGS=("$@")

# If no logs specified, use defaults
if [ $\{#LOGS[@]\} -eq 0 ]; then
  echo "No log files specified, using defaults."
  LOGS=(
    "/var/log/syslog"
    "/var/log/auth.log"
    "/var/log/nginx/error.log"
    "/var/log/apache2/error.log"
  )
fi

# Filter out non-existent logs
VALID_LOGS=()
for LOG in "$\{LOGS[@]\}"; do
  if [ -f "$LOG" ]; then
    VALID_LOGS+=("$LOG")
  else
    echo "Warning: Log file not found: $LOG"
  fi
done

# Check if we have valid logs to monitor
if [ $\{#VALID_LOGS[@]\} -eq 0 ]; then
  echo "Error: No valid log files to monitor."
  exit 1
fi

echo "Monitoring the following logs in real-time:"
for LOG in "$\{VALID_LOGS[@]\}"; do
  echo "- $LOG"
done
echo "Press Ctrl+C to exit."
echo "----------------------------------------"

# Start tail with color coding for different logs
tail -f "$\{VALID_LOGS[@]\}" | awk '
  /error|ERROR|critical|CRITICAL|fail|FAIL/ {print "\\x1b[31m" $0 "\\x1b[0m"; next}  # Red for errors
  /warn|WARN|warning|WARNING/ {print "\\x1b[33m" $0 "\\x1b[0m"; next}                # Yellow for warnings
  /success|SUCCESS/ {print "\\x1b[32m" $0 "\\x1b[0m"; next}                          # Green for success
  {print}                                                                         # Default color
'

exit 0
`
  },
  {
    id: "archive-old-logs",
    name: "Archive Old Logs",
    description: "Archives log files older than a specified age",
    category: "log-management",
    template: `#!/bin/bash

# Archive Old Logs Script
# Description: Archives log files older than a specified age
# Usage: ./archive_logs.sh [days] [log_directory] [archive_directory]

# Set parameters
DAYS=\${1:-30}
LOG_DIR=\${2:-"/var/log"}
ARCHIVE_DIR=\${3:-"/var/log/archives"}
DATE=$(date +"%Y%m%d")

echo "Archiving logs older than $DAYS days..."
echo "Log directory: $LOG_DIR"
echo "Archive directory: $ARCHIVE_DIR"

# Create archive directory if it doesn't exist
if [ ! -d "$ARCHIVE_DIR" ]; then
  mkdir -p "$ARCHIVE_DIR"
  echo "Created archive directory: $ARCHIVE_DIR"
fi

# Find and archive old log files
echo "Finding log files older than $DAYS days..."
COUNT=0
ARCHIVE_FILE="$ARCHIVE_DIR/logs_older_than_\${DAYS}days_\${DATE}.tar.gz"

# Create a list of files to archive
FILES_LIST=$(find "$LOG_DIR" -name "*.log*" -o -name "*.gz" -type f -mtime +$DAYS)

if [ -z "$FILES_LIST" ]; then
  echo "No log files older than $DAYS days found."
  exit 0
fi

# Count files to archive
COUNT=$(echo "$FILES_LIST" | wc -l)
echo "Found $COUNT log files to archive."

# Create archive
echo "Creating archive: $ARCHIVE_FILE"
echo "$FILES_LIST" | tar -czf "$ARCHIVE_FILE" -T -

# Check if archive was created successfully
if [ $? -eq 0 ]; then
  echo "Archive created successfully: $ARCHIVE_FILE"
  echo "Archive size: $(du -h "$ARCHIVE_FILE" | cut -f1)"
  
  # Optional: Delete original files
  read -p "Delete original log files? [y/N] " -r
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Deleting original log files..."
    echo "$FILES_LIST" | xargs rm -f
    echo "Original log files deleted."
  fi
else
  echo "Error: Failed to create archive."
  exit 1
fi

echo "Log archiving completed."
exit 0
`
  },
  {
    id: "parse-logs-for-errors",
    name: "Parse Logs for Errors",
    description: "Extracts error and warning messages from log files",
    category: "log-management",
    template: `#!/bin/bash

# Parse Logs for Errors Script
# Description: Extracts error and warning messages from log files
# Usage: ./parse_logs_errors.sh [log_file] [output_file]

# Set parameters
LOG_FILE=\${1:-"/var/log/syslog"}
OUTPUT_FILE=\${2:-"error_report_$(date +"%Y%m%d").txt"}

echo "Parsing log file for errors: $LOG_FILE"
echo "Output file: $OUTPUT_FILE"

# Check if log file exists
if [ ! -f "$LOG_FILE" ]; then
  echo "Error: Log file $LOG_FILE does not exist."
  exit 1
fi

# Create report header
cat > "$OUTPUT_FILE" << EOF
===================================================
ERROR REPORT: $(date)
Log file: $LOG_FILE
===================================================

CRITICAL ERRORS:
----------------
EOF

# Extract critical errors
grep -i "\\b\\(critical\\|emergency\\|alert\\|fatal\\|failed\\|failure\\)\\b" "$LOG_FILE" | 
  sort | uniq -c | sort -rn >> "$OUTPUT_FILE"

# Add errors section
cat >> "$OUTPUT_FILE" << EOF

ERRORS:
-------
EOF

# Extract errors
grep -i "\\b\\(error\\|exception\\|crash\\|abort\\)\\b" "$LOG_FILE" | 
  grep -v -i "\\b\\(critical\\|emergency\\|alert\\|fatal\\)\\b" | 
  sort | uniq -c | sort -rn >> "$OUTPUT_FILE"

# Add warnings section
cat >> "$OUTPUT_FILE" << EOF

WARNINGS:
---------
EOF

# Extract warnings
grep -i "\\b\\(warning\\|warn\\)\\b" "$LOG_FILE" | 
  sort | uniq -c | sort -rn >> "$OUTPUT_FILE"

# Add summary
ERROR_COUNT=$(grep -i "\\b\\(error\\|critical\\|emergency\\|alert\\|fatal\\|exception\\|crash\\|abort\\|failed\\|failure\\)\\b" "$LOG_FILE" | wc -l)
WARNING_COUNT=$(grep -i "\\b\\(warning\\|warn\\)\\b" "$LOG_FILE" | wc -l)

cat >> "$OUTPUT_FILE" << EOF

===================================================
SUMMARY:
Total Errors: $ERROR_COUNT
Total Warnings: $WARNING_COUNT
===================================================
EOF

echo "Log parsing completed. Found $ERROR_COUNT errors and $WARNING_COUNT warnings."
echo "Report saved to: $OUTPUT_FILE"
exit 0
`
  }
];

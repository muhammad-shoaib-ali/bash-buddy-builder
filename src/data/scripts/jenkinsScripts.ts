
import { BoilerplateScript } from '@/types/scripts';

export const jenkinsScripts: BoilerplateScript[] = [
  {
    id: "jenkins-safe-restart",
    name: "Safely Restart Jenkins",
    description: "Safely restarts Jenkins service after waiting for jobs to complete",
    category: "jenkins",
    template: `#!/bin/bash

# Jenkins Safe Restart Script
# Description: Safely restarts Jenkins after waiting for running jobs to complete
# Usage: ./jenkins_safe_restart.sh [jenkins_url] [username] [api_token] [timeout_minutes]

JENKINS_URL=\${1:-"http://localhost:8080"}
USERNAME=\${2:-"admin"}
API_TOKEN=\${3:-"your-api-token"}
TIMEOUT=\${4:-30}  # Timeout in minutes

# Remove trailing slash if present
JENKINS_URL=$(echo "$JENKINS_URL" | sed 's#/$##')

echo "Starting Jenkins safe restart procedure..."
echo "Jenkins URL: $JENKINS_URL"

# Check if curl is installed
if ! command -v curl &> /dev/null; then
  echo "Error: curl is not installed."
  exit 1
fi

# Function to check if any jobs are running
check_running_jobs() {
  local response
  response=$(curl -s -u "$USERNAME:$API_TOKEN" "$JENKINS_URL/api/json?tree=jobs[name,color]")
  
  if [[ "$response" == *"color\\\":\\\"blue_anime\\\"\"* || 
        "$response" == *"color\\\":\\\"yellow_anime\\\"\"* || 
        "$response" == *"color\\\":\\\"red_anime\\\"\"* ]]; then
    return 0  # Jobs running
  else
    return 1  # No jobs running
  fi
}

# Check if Jenkins is reachable
echo "Checking if Jenkins is reachable..."
if ! curl -s -I -u "$USERNAME:$API_TOKEN" "$JENKINS_URL" | grep -q "200 OK"; then
  echo "Error: Jenkins is not reachable or credentials are invalid."
  exit 1
fi

# Wait for running jobs to complete
echo "Checking for running jobs..."
if check_running_jobs; then
  echo "Jobs are currently running. Waiting for completion..."
  
  start_time=$(date +%s)
  timeout_seconds=$((TIMEOUT * 60))
  
  while check_running_jobs; do
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))
    
    if [ "$elapsed" -gt "$timeout_seconds" ]; then
      echo "Timeout reached. Some jobs are still running."
      read -p "Do you want to proceed with restart anyway? (y/N) " -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Restart cancelled."
        exit 0
      fi
      break
    fi
    
    echo "Still waiting for jobs to complete... ($(( (timeout_seconds - elapsed) / 60 )) minutes remaining)"
    sleep 10
  done
else
  echo "No jobs are currently running."
fi

# Initiate safe restart
echo "Initiating Jenkins safe restart..."
curl -X POST -u "$USERNAME:$API_TOKEN" "$JENKINS_URL/safeRestart"

if [ $? -eq 0 ]; then
  echo "Jenkins restart initiated successfully."
  echo "Jenkins will be available again shortly."
else
  echo "Error: Failed to restart Jenkins."
  exit 1
fi

exit 0`
  },
  {
    id: "jenkins-backup",
    name: "Backup Jenkins Home",
    description: "Creates a backup of Jenkins home directory",
    category: "jenkins",
    template: `#!/bin/bash

# Jenkins Backup Script
# Description: Creates a backup of Jenkins home directory
# Usage: ./jenkins_backup.sh [jenkins_home] [backup_dir]

# Default paths
JENKINS_HOME=\${1:-"/var/lib/jenkins"}
BACKUP_DIR=\${2:-"/var/backups/jenkins"}
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="jenkins_backup_$DATE.tar.gz"

# Check if Jenkins home exists
if [ ! -d "$JENKINS_HOME" ]; then
  echo "Error: Jenkins home directory $JENKINS_HOME does not exist."
  exit 1
fi

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
  mkdir -p "$BACKUP_DIR"
fi

echo "Starting Jenkins backup..."
echo "Jenkins home: $JENKINS_HOME"
echo "Backup location: $BACKUP_DIR/$BACKUP_FILE"

# Check available disk space
NEEDED_SPACE=$(du -s "$JENKINS_HOME" | awk '{print $1}')
AVAILABLE_SPACE=$(df -k "$BACKUP_DIR" | tail -1 | awk '{print $4}')

echo "Required space: $(( NEEDED_SPACE / 1024 )) MB"
echo "Available space: $(( AVAILABLE_SPACE / 1024 )) MB"

if [ "$NEEDED_SPACE" -gt "$AVAILABLE_SPACE" ]; then
  echo "Error: Not enough disk space for backup."
  exit 1
fi

# List of directories/files to exclude
EXCLUDES=(
  "workspace"
  "builds"
  ".cache"
  "war"
  "plugins/*/WEB-INF/lib"
  "caches"
)

# Build the exclude parameters
EXCLUDE_PARAMS=""
for item in "\${EXCLUDES[@]}"; do
  EXCLUDE_PARAMS="$EXCLUDE_PARAMS --exclude=$item"
done

# Create the backup
echo "Creating backup (excluding workspace, builds, and caches)..."
tar -czf "$BACKUP_DIR/$BACKUP_FILE" $EXCLUDE_PARAMS -C "$(dirname "$JENKINS_HOME")" "$(basename "$JENKINS_HOME")"

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "Backup completed successfully."
  echo "Backup size: $(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)"
  echo "Backup location: $BACKUP_DIR/$BACKUP_FILE"
else
  echo "Error: Backup failed."
  exit 1
fi

# Optional: Remove old backups (keep last 5)
echo "Cleaning up old backups..."
ls -1t "$BACKUP_DIR"/jenkins_backup_*.tar.gz | tail -n +6 | xargs -r rm
echo "Done."

exit 0`
  },
  {
    id: "jenkins-failed-builds",
    name: "List Failed Jenkins Builds",
    description: "Lists all failed Jenkins builds from all jobs",
    category: "jenkins",
    template: `#!/bin/bash

# List Failed Jenkins Builds Script
# Description: Lists all failed builds from Jenkins jobs
# Usage: ./list_failed_builds.sh [jenkins_url] [username] [api_token] [days]

JENKINS_URL=\${1:-"http://localhost:8080"}
USERNAME=\${2:-"admin"}
API_TOKEN=\${3:-"your-api-token"}
DAYS=\${4:-7}  # Number of days to look back

# Remove trailing slash if present
JENKINS_URL=$(echo "$JENKINS_URL" | sed 's#/$##')

echo "Listing failed Jenkins builds from the past $DAYS days..."
echo "Jenkins URL: $JENKINS_URL"

# Check if curl and jq are installed
if ! command -v curl &> /dev/null; then
  echo "Error: curl is not installed."
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo "Error: jq is not installed. Please install jq for JSON parsing."
  exit 1
fi

# Check if Jenkins is reachable
echo "Checking if Jenkins is reachable..."
if ! curl -s -I -u "$USERNAME:$API_TOKEN" "$JENKINS_URL" | grep -q "200 OK"; then
  echo "Error: Jenkins is not reachable or credentials are invalid."
  exit 1
fi

# Calculate the timestamp for N days ago
TIMESTAMP=$(date -d "$DAYS days ago" +%s)000  # Convert to milliseconds

# Get list of all jobs
echo "Fetching list of jobs..."
JOBS_JSON=$(curl -s -u "$USERNAME:$API_TOKEN" "$JENKINS_URL/api/json?tree=jobs[name,url]")

# Extract job names and URLs
echo "Analyzing jobs for failures..."
JOBS=$(echo "$JOBS_JSON" | jq -r '.jobs[] | .name + "," + .url')

# Headers for the report
printf "%-40s %-20s %-30s %-50s\\\\n" "JOB NAME" "BUILD NUMBER" "DATE" "FAILURE REASON"
printf "%-40s %-20s %-30s %-50s\\\\n" "$(printf '%0.s-' {1..40})" "$(printf '%0.s-' {1..20})" "$(printf '%0.s-' {1..30})" "$(printf '%0.s-' {1..50})"

# Get failed builds for each job
FOUND_FAILURES=false
while IFS=',' read -r JOB_NAME JOB_URL; do
  # Fetch builds for this job
  BUILDS_JSON=$(curl -s -u "$USERNAME:$API_TOKEN" "$JOB_URL/api/json?tree=builds[number,timestamp,result,url]")
  
  # Filter and display failed builds
  FAILED_BUILDS=$(echo "$BUILDS_JSON" | jq -r ".builds[] | select(.result == \\\"FAILURE\\\" and .timestamp >= $TIMESTAMP) | [.number, .timestamp, .url] | @csv")
  
  if [ -n "$FAILED_BUILDS" ]; then
    FOUND_FAILURES=true
    while IFS=',' read -r BUILD_NUM TIMESTAMP BUILD_URL; do
      # Remove quotes from values
      BUILD_NUM=$(echo "$BUILD_NUM" | tr -d '"')
      TIMESTAMP=$(echo "$TIMESTAMP" | tr -d '"')
      BUILD_URL=$(echo "$BUILD_URL" | tr -d '"')
      
      # Convert timestamp to readable date
      BUILD_DATE=$(date -d @$(( TIMESTAMP / 1000 )) "+%Y-%m-%d %H:%M:%S")
      
      # Get the failure reason from the console log (just the first error line for brevity)
      CONSOLE_LOG=$(curl -s -u "$USERNAME:$API_TOKEN" "$BUILD_URL/consoleText")
      FAILURE_REASON=$(echo "$CONSOLE_LOG" | grep -m 1 -E 'ERROR:|FAILURE:|Exception:|failed with exit code')
      FAILURE_REASON="${FAILURE_REASON:0:50}"  # Truncate to 50 chars
      
      # Print the information
      printf "%-40s %-20s %-30s %-50s\\\\n" "$JOB_NAME" "#$BUILD_NUM" "$BUILD_DATE" "$FAILURE_REASON"
    done <<< "$FAILED_BUILDS"
  fi
done <<< "$JOBS"

if [ "$FOUND_FAILURES" = false ]; then
  echo "No failed builds found in the past $DAYS days."
fi

exit 0`
  },
  {
    id: "jenkins-plugin-manager",
    name: "Jenkins Plugin Manager",
    description: "Installs or updates Jenkins plugins from the command line",
    category: "jenkins",
    template: `#!/bin/bash

# Jenkins Plugin Manager Script
# Description: Installs or updates Jenkins plugins via CLI
# Usage: ./jenkins_plugins.sh [action] [jenkins_url] [username] [api_token]

ACTION=\${1:-"list"}  # list, install, update-all
JENKINS_URL=\${2:-"http://localhost:8080"}
USERNAME=\${3:-"admin"}
API_TOKEN=\${4:-"your-api-token"}
PLUGIN=\${5:-""}  # Plugin name for install action

# Remove trailing slash if present
JENKINS_URL=$(echo "$JENKINS_URL" | sed 's#/$##')

# Check if curl is installed
if ! command -v curl &> /dev/null; then
  echo "Error: curl is not installed."
  exit 1
fi

# Check if Jenkins is reachable
echo "Checking if Jenkins is reachable..."
if ! curl -s -I -u "$USERNAME:$API_TOKEN" "$JENKINS_URL" | grep -q "200 OK"; then
  echo "Error: Jenkins is not reachable or credentials are invalid."
  exit 1
fi

# Function to download Jenkins CLI jar if not exists
get_jenkins_cli() {
  if [ ! -f "jenkins-cli.jar" ]; then
    echo "Downloading Jenkins CLI jar..."
    curl -s -o jenkins-cli.jar "$JENKINS_URL/jnlpJars/jenkins-cli.jar"
    
    if [ ! -f "jenkins-cli.jar" ]; then
      echo "Error: Failed to download Jenkins CLI jar."
      exit 1
    fi
  fi
}

case "$ACTION" in
  list)
    echo "Listing installed Jenkins plugins..."
    curl -s -u "$USERNAME:$API_TOKEN" "$JENKINS_URL/pluginManager/api/json?depth=1&tree=plugins[shortName,version,hasUpdate]" | 
      python3 -c "
import json, sys
data = json.load(sys.stdin)
plugins = sorted(data['plugins'], key=lambda x: x['shortName'].lower())
print('{:<30} {:<15} {:<10}'.format('PLUGIN NAME', 'VERSION', 'UPDATE?'))
print('-' * 60)
for plugin in plugins:
    print('{:<30} {:<15} {:<10}'.format(
        plugin['shortName'], 
        plugin['version'], 
        'Yes' if plugin['hasUpdate'] else 'No'
    ))
print('\\nTotal plugins: {}'.format(len(plugins)))
"
    ;;
    
  install)
    if [ -z "$PLUGIN" ]; then
      echo "Error: No plugin specified for installation."
      echo "Usage: $0 install [jenkins_url] [username] [api_token] [plugin_name]"
      exit 1
    fi
    
    echo "Installing Jenkins plugin: $PLUGIN"
    get_jenkins_cli
    
    java -jar jenkins-cli.jar -s "$JENKINS_URL" -auth "$USERNAME:$API_TOKEN" install-plugin "$PLUGIN" -restart
    
    if [ $? -eq 0 ]; then
      echo "Plugin $PLUGIN installed successfully. Jenkins will restart."
    else
      echo "Error: Failed to install plugin $PLUGIN."
      exit 1
    fi
    ;;
    
  update-all)
    echo "Updating all Jenkins plugins..."
    get_jenkins_cli
    
    java -jar jenkins-cli.jar -s "$JENKINS_URL" -auth "$USERNAME:$API_TOKEN" install-plugin $(curl -s -u "$USERNAME:$API_TOKEN" "$JENKINS_URL/pluginManager/api/json?depth=1&tree=plugins[shortName,hasUpdate]" | python3 -c "
import json, sys
data = json.load(sys.stdin)
updates = [p['shortName'] for p in data['plugins'] if p['hasUpdate']]
print(' '.join(updates))
")
    
    if [ $? -eq 0 ]; then
      echo "All plugins updated successfully. Jenkins will restart."
    else
      echo "Error: Failed to update plugins."
      exit 1
    fi
    ;;
    
  *)
    echo "Invalid action: $ACTION"
    echo "Valid actions: list, install, update-all"
    exit 1
    ;;
esac

exit 0`
  },
  {
    id: "jenkins-job-trigger",
    name: "Trigger Jenkins Job",
    description: "Triggers a Jenkins job from the command line",
    category: "jenkins",
    template: `#!/bin/bash

# Jenkins Job Trigger Script
# Description: Triggers a Jenkins job and optionally waits for completion
# Usage: ./trigger_jenkins_job.sh [job_name] [jenkins_url] [username] [api_token] [wait]

JOB_NAME=\${1:-""}
JENKINS_URL=\${2:-"http://localhost:8080"}
USERNAME=\${3:-"admin"}
API_TOKEN=\${4:-"your-api-token"}
WAIT=\${5:-"false"}  # Wait for job completion

# Check if job name was provided
if [ -z "$JOB_NAME" ]; then
  echo "Error: No job name specified."
  echo "Usage: $0 [job_name] [jenkins_url] [username] [api_token] [wait]"
  exit 1
fi

# Remove trailing slash if present
JENKINS_URL=$(echo "$JENKINS_URL" | sed 's#/$##')

# URL encode job name for spaces and special characters
JOB_NAME_ENCODED=$(echo "$JOB_NAME" | sed 's/ /%20/g' | sed 's/\\//%2F/g')

echo "Triggering Jenkins job: $JOB_NAME"
echo "Jenkins URL: $JENKINS_URL"

# Check if curl is installed
if ! command -v curl &> /dev/null; then
  echo "Error: curl is not installed."
  exit 1
fi

# Check if Jenkins and job are reachable
echo "Checking if Jenkins and job are reachable..."
if ! curl -s -I -u "$USERNAME:$API_TOKEN" "$JENKINS_URL/job/$JOB_NAME_ENCODED" | grep -q "200 OK"; then
  echo "Error: Jenkins or job is not reachable. Check URL and job name."
  exit 1
fi

# Function to get next build number
get_next_build_number() {
  curl -s -u "$USERNAME:$API_TOKEN" "$JENKINS_URL/job/$JOB_NAME_ENCODED/api/json" | 
    python3 -c "import json,sys;print(json.load(sys.stdin).get('nextBuildNumber',0))"
}

# Get the next build number before triggering
NEXT_BUILD=$(get_next_build_number)

# Trigger the job
echo "Triggering build #$NEXT_BUILD..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST -u "$USERNAME:$API_TOKEN" "$JENKINS_URL/job/$JOB_NAME_ENCODED/build")

if [ "$HTTP_CODE" -eq 201 ]; then
  echo "Job triggered successfully."
  
  # Wait for job to start (it might take a moment)
  echo "Waiting for job to start..."
  sleep 5
  
  # If requested, wait for job completion
  if [ "$WAIT" = "true" ]; then
    echo "Waiting for job completion..."
    
    # Poll until job is complete
    while true; do
      # Check if build exists yet
      if curl -s -u "$USERNAME:$API_TOKEN" "$JENKINS_URL/job/$JOB_NAME_ENCODED/$NEXT_BUILD/api/json" | grep -q "result"; then
        # Get build result
        RESULT=$(curl -s -u "$USERNAME:$API_TOKEN" "$JENKINS_URL/job/$JOB_NAME_ENCODED/$NEXT_BUILD/api/json" | 
          python3 -c "import json,sys;print(json.load(sys.stdin).get('result','UNKNOWN'))")
        
        if [ "$RESULT" != "null" ]; then
          echo "Build #$NEXT_BUILD completed with result: $RESULT"
          
          # Get console output URL
          CONSOLE_URL="$JENKINS_URL/job/$JOB_NAME_ENCODED/$NEXT_BUILD/console"
          echo "Console output: $CONSOLE_URL"
          
          # Exit with appropriate status code
          if [ "$RESULT" = "SUCCESS" ]; then
            exit 0
          else
            exit 1
          fi
        fi
      fi
      
      echo "Job still running... (checking again in 5 seconds)"
      sleep 5
    done
  fi
  
else
  echo "Error: Failed to trigger job. HTTP status code: $HTTP_CODE"
  exit 1
fi

exit 0`
  }
];

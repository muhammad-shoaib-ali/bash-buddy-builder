
import { BoilerplateScript } from '@/types/scripts';

export const dockerManagementScripts: BoilerplateScript[] = [
  {
    id: "docker-container-management",
    name: "Start/Stop All Containers",
    description: "Starts or stops all Docker containers",
    category: "docker-management",
    template: `#!/bin/bash

# Docker Container Management Script
# Description: Starts or stops all Docker containers
# Usage: ./docker_containers.sh [start|stop|restart]

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "Error: Docker is not installed or not in PATH."
  exit 1
fi

# Set action
ACTION=\${1:-"start"}

case "$ACTION" in
  start)
    echo "Starting all Docker containers..."
    docker start $(docker ps -a -q)
    ;;
  stop)
    echo "Stopping all Docker containers..."
    docker stop $(docker ps -q)
    ;;
  restart)
    echo "Restarting all Docker containers..."
    docker restart $(docker ps -q)
    ;;
  *)
    echo "Invalid action. Use 'start', 'stop', or 'restart'."
    exit 1
    ;;
esac

echo "Container $ACTION operation completed."
docker ps
exit 0
`
  },
  {
    id: "docker-clean-dangling",
    name: "Clean Dangling Images",
    description: "Removes dangling Docker images and containers",
    category: "docker-management",
    template: `#!/bin/bash

# Docker Cleanup Script
# Description: Removes dangling images, stopped containers, unused networks
# Usage: ./docker_cleanup.sh

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "Error: Docker is not installed or not in PATH."
  exit 1
fi

echo "Starting Docker cleanup..."

# Remove stopped containers
echo "Removing stopped containers..."
CONTAINERS=$(docker ps -a -q -f status=exited)
if [ -n "$CONTAINERS" ]; then
  docker rm $CONTAINERS
  echo "Stopped containers removed."
else
  echo "No stopped containers to remove."
fi

# Remove dangling images
echo "Removing dangling images..."
IMAGES=$(docker images -f "dangling=true" -q)
if [ -n "$IMAGES" ]; then
  docker rmi $IMAGES
  echo "Dangling images removed."
else
  echo "No dangling images to remove."
fi

# Remove unused networks
echo "Removing unused networks..."
docker network prune -f

echo "Docker cleanup completed successfully."
exit 0
`
  },
  {
    id: "docker-system-prune",
    name: "Prune Docker System",
    description: "Completely cleans the Docker system",
    category: "docker-management",
    template: `#!/bin/bash

# Docker System Prune Script
# Description: Completely cleans the Docker system
# Usage: ./docker_prune.sh

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "Error: Docker is not installed or not in PATH."
  exit 1
fi

echo "This will remove:"
echo "  - All stopped containers"
echo "  - All networks not used by at least one container"
echo "  - All unused images"
echo "  - All dangling images"
echo "  - All build cache"
echo ""
read -p "Are you sure you want to continue? [y/N] " -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Starting Docker system prune..."
  
  # Run system prune with verbose output
  docker system prune -a --volumes -f
  
  echo "Docker system prune completed."
else
  echo "Operation cancelled."
fi

exit 0
`
  },
  {
    id: "docker-export-import",
    name: "Export/Import Docker Container",
    description: "Exports a container to a tarball and imports it",
    category: "docker-management",
    template: `#!/bin/bash

# Docker Container Export/Import Script
# Description: Exports and imports Docker containers
# Usage: ./docker_export_import.sh [export|import] [container_name/image_name] [output_file/input_file]

ACTION=\${1:-"export"}
TARGET=\${2:-""}
FILE=\${3:-""}

if [ -z "$TARGET" ]; then
  echo "Error: No container/image name specified."
  echo "Usage: $0 [export|import] [container_name/image_name] [output_file/input_file]"
  exit 1
fi

case "$ACTION" in
  export)
    if [ -z "$FILE" ]; then
      FILE="$TARGET-export-$(date +%Y%m%d%H%M%S).tar"
    fi
    
    echo "Exporting container $TARGET to $FILE..."
    docker export "$TARGET" > "$FILE"
    
    if [ $? -eq 0 ]; then
      echo "Container exported successfully to $FILE"
      echo "File size: $(du -h "$FILE" | cut -f1)"
    else
      echo "Error exporting container."
      exit 1
    fi
    ;;
    
  import)
    if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
      echo "Error: Input file not specified or doesn't exist."
      exit 1
    fi
    
    echo "Importing container from $FILE as $TARGET..."
    cat "$FILE" | docker import - "$TARGET"
    
    if [ $? -eq 0 ]; then
      echo "Container imported successfully as $TARGET"
      echo "To create a container from this image: docker create --name=container_name $TARGET"
    else
      echo "Error importing container."
      exit 1
    fi
    ;;
    
  *)
    echo "Invalid action. Use 'export' or 'import'."
    exit 1
    ;;
esac

exit 0
`
  },
  {
    id: "docker-resource-usage",
    name: "Monitor Container Resources",
    description: "Monitors resource usage of Docker containers",
    category: "docker-management",
    template: `#!/bin/bash

# Docker Container Resource Monitoring Script
# Description: Monitors CPU, memory, and network usage of Docker containers
# Usage: ./docker_monitor.sh [container_name] [interval_seconds]

CONTAINER=\${1:-""}
INTERVAL=\${2:-5}

# Check if a specific container was specified
if [ -n "$CONTAINER" ]; then
  # Check if container exists
  if ! docker ps -a --format '{{.Names}}' | grep -q "^$CONTAINER$"; then
    echo "Error: Container '$CONTAINER' not found."
    exit 1
  fi
  
  echo "Monitoring resource usage for container: $CONTAINER"
  echo "Press Ctrl+C to exit."
  echo "-----------------------------------------"
  
  while true; do
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Get CPU, memory, and network usage
    docker stats --no-stream "$CONTAINER"
    
    sleep $INTERVAL
    echo "-----------------------------------------"
  done
else
  # Monitor all running containers
  echo "Monitoring resource usage for all running containers."
  echo "Press Ctrl+C to exit."
  echo "-----------------------------------------"
  
  while true; do
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Get stats for all running containers
    docker stats --no-stream
    
    sleep $INTERVAL
    echo "-----------------------------------------"
  done
fi

exit 0
`
  },
  {
    id: "docker-auto-restart",
    name: "Auto-Restart Failed Containers",
    description: "Automatically restarts failed Docker containers",
    category: "docker-management",
    template: `#!/bin/bash

# Auto-Restart Failed Docker Containers Script
# Description: Automatically restarts Docker containers that have exited with error
# Usage: ./docker_auto_restart.sh [max_restarts]

MAX_RESTARTS=\${1:-3}

echo "Starting Docker container health monitor..."
echo "Max restart attempts: $MAX_RESTARTS"
echo "Press Ctrl+C to exit."
echo "-----------------------------------------"

# Get list of containers that have exited with non-zero status
FAILED_CONTAINERS=$(docker ps -a --filter 'status=exited' --filter 'exited!=0' --format '{{.Names}}')

if [ -z "$FAILED_CONTAINERS" ]; then
  echo "No failed containers found."
  exit 0
fi

echo "Found failed containers:"
echo "$FAILED_CONTAINERS"
echo "-----------------------------------------"

# Track restart attempts
declare -A restart_count

for CONTAINER in $FAILED_CONTAINERS; do
  # Initialize restart counter if needed
  if [ -z "${restart_count[$CONTAINER]}" ]; then
    restart_count[$CONTAINER]=0
  fi
  
  # Check if max restarts reached
  if [ "${restart_count[$CONTAINER]}" -ge "$MAX_RESTARTS" ]; then
    echo "⚠️ Container $CONTAINER has reached max restart attempts ($MAX_RESTARTS). Skipping."
    continue
  fi
  
  echo "Attempting to restart container: $CONTAINER"
  if docker start "$CONTAINER"; then
    echo "✅ Container $CONTAINER restarted successfully."
    restart_count[$CONTAINER]=$((${restart_count[$CONTAINER]}+1))
    echo "   Restart attempt: ${restart_count[$CONTAINER]}/$MAX_RESTARTS"
  else
    echo "❌ Failed to restart container $CONTAINER."
  fi
done

echo "-----------------------------------------"
echo "Container restart process completed."
exit 0
`
  }
];

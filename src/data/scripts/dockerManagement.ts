
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
  }
];

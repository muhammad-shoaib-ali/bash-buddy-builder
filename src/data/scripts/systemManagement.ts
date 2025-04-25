
import { BoilerplateScript } from '@/types/scripts';

export const systemManagementScripts: BoilerplateScript[] = [
  {
    id: "update-packages",
    name: "Update & Upgrade Packages",
    description: "Updates and upgrades all system packages",
    category: "system-management",
    template: `#!/bin/bash

# System Update & Upgrade Script
# Description: Updates and upgrades all system packages
# Usage: ./update_packages.sh

echo "Starting system update and upgrade..."

# Update package lists
apt-get update

# Upgrade packages
apt-get upgrade -y

# Perform distribution upgrade
apt-get dist-upgrade -y

# Remove unnecessary packages
apt-get autoremove -y
apt-get autoclean

echo "System update and upgrade completed successfully!"
exit 0
`
  },
  {
    id: "system-reboot",
    name: "System Reboot with Countdown",
    description: "Initiates a system reboot with a configurable countdown",
    category: "system-management",
    template: `#!/bin/bash

# System Reboot with Countdown Script
# Description: Initiates system reboot with countdown
# Usage: ./reboot_system.sh [minutes]

# Set countdown time (default: 5 minutes)
COUNTDOWN=\${1:-5}

echo "System will reboot in $COUNTDOWN minutes..."

# Convert minutes to seconds
SECONDS=$((COUNTDOWN * 60))

while [ $SECONDS -gt 0 ]; do
  echo -ne "Rebooting in: \$(printf '%02d:%02d' \$(($SECONDS/60)) \$(($SECONDS%60)))\\r"
  sleep 1
  ((SECONDS--))
done

echo "Initiating system reboot now..."
shutdown -r now
`
  }
  // ... Add more system management scripts here
];

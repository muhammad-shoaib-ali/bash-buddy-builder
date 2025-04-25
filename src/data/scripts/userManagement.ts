
import { BoilerplateScript } from '@/types/scripts';

export const userManagementScripts: BoilerplateScript[] = [
  {
    id: "create-sudo-user",
    name: "Create User with Sudo Rights",
    description: "Creates a new user and grants sudo privileges",
    category: "user-management",
    template: `#!/bin/bash

# Create User with Sudo Rights Script
# Description: Creates a new user and adds them to sudo group
# Usage: ./create_sudo_user.sh [username]

USERNAME=\${1:-"newuser"}

# Create user
useradd -m -s /bin/bash $USERNAME

# Set password
passwd $USERNAME

# Add to sudo group
usermod -aG sudo $USERNAME

echo "User $USERNAME created and added to sudo group"
exit 0
`
  },
  // ... Add more user management scripts here
];


import { BoilerplateScript } from '@/types/scripts';

export const securityManagementScripts: BoilerplateScript[] = [
  {
    id: "disable-root-ssh",
    name: "Disable Root SSH Login",
    description: "Secures SSH by disabling direct root login",
    category: "security-management",
    template: `#!/bin/bash

# Disable Root SSH Login Script
# Description: Secures SSH by disabling direct root login
# Usage: ./disable_root_ssh.sh

echo "Securing SSH by disabling direct root login..."

# Backup SSH config file
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
echo "SSH config backed up to /etc/ssh/sshd_config.bak"

# Modify SSH config to disable root login
sed -i 's/^#*PermitRootLogin.*$/PermitRootLogin no/' /etc/ssh/sshd_config

# Check if modification was successful
if grep -q "PermitRootLogin no" /etc/ssh/sshd_config; then
  echo "Root SSH login has been disabled."
  
  # Restart SSH service to apply changes
  if systemctl is-active sshd &>/dev/null; then
    systemctl restart sshd
  elif systemctl is-active ssh &>/dev/null; then
    systemctl restart ssh
  else
    service sshd restart 2>/dev/null || service ssh restart 2>/dev/null
  fi
  
  echo "SSH service has been restarted with new configuration."
  echo "WARNING: Make sure you have another way to access the system as a non-root user with sudo privileges!"
else
  echo "Error: Failed to disable root SSH login."
  exit 1
fi

exit 0
`
  },
  {
    id: "fail2ban-install",
    name: "Install & Configure Fail2Ban",
    description: "Installs and configures Fail2Ban to protect against brute force attacks",
    category: "security-management",
    template: `#!/bin/bash

# Fail2Ban Install Script
# Description: Installs and configures Fail2Ban to protect against brute force attacks
# Usage: ./install_fail2ban.sh

echo "Installing and configuring Fail2Ban..."

# Check which package manager is available
if command -v apt &> /dev/null; then
  PKG_MANAGER="apt"
elif command -v yum &> /dev/null; then
  PKG_MANAGER="yum"
elif command -v dnf &> /dev/null; then
  PKG_MANAGER="dnf"
else
  echo "Error: Unsupported package manager. Cannot install Fail2Ban."
  exit 1
fi

# Install Fail2Ban
echo "Installing Fail2Ban using $PKG_MANAGER..."
if [ "$PKG_MANAGER" = "apt" ]; then
  apt update
  apt install -y fail2ban
elif [ "$PKG_MANAGER" = "yum" ]; then
  yum install -y epel-release
  yum install -y fail2ban
elif [ "$PKG_MANAGER" = "dnf" ]; then
  dnf install -y epel-release
  dnf install -y fail2ban
fi

# Check if installation was successful
if ! command -v fail2ban-client &> /dev/null; then
  echo "Error: Fail2Ban installation failed."
  exit 1
fi

# Configure Fail2Ban
echo "Configuring Fail2Ban..."
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Create custom jail configuration
cat > /etc/fail2ban/jail.d/custom.conf << EOF
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
findtime = 600
EOF

# Start and enable Fail2Ban service
systemctl start fail2ban
systemctl enable fail2ban

echo "Fail2Ban installed and configured successfully."
echo "SSH jail is active with 5 max retries and 1-hour ban time."
echo "You can check status with: fail2ban-client status sshd"
exit 0
`
  },
  {
    id: "firewall-rules",
    name: "Configure Basic Firewall Rules",
    description: "Sets up basic firewall rules using UFW or iptables",
    category: "security-management",
    template: `#!/bin/bash

# Basic Firewall Configuration Script
# Description: Sets up basic firewall rules using UFW or iptables
# Usage: ./configure_firewall.sh

# First, determine which firewall is available
if command -v ufw &> /dev/null; then
  echo "Using UFW firewall..."
  
  # Reset UFW to default state
  ufw --force reset
  
  # Set default policies
  ufw default deny incoming
  ufw default allow outgoing
  
  # Allow SSH
  ufw allow ssh
  
  # Optional: Allow other common services
  # Uncomment lines below as needed
  # ufw allow http
  # ufw allow https
  # ufw allow 3306/tcp  # MySQL
  # ufw allow 1194/udp  # OpenVPN
  
  # Enable UFW
  echo "y" | ufw enable
  
  echo "UFW firewall configured and enabled successfully."
  ufw status verbose
  
elif command -v iptables &> /dev/null; then
  echo "Using iptables firewall..."
  
  # Flush existing rules
  iptables -F
  iptables -X
  
  # Set default policies
  iptables -P INPUT DROP
  iptables -P FORWARD DROP
  iptables -P OUTPUT ACCEPT
  
  # Allow established connections
  iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
  
  # Allow local loopback
  iptables -A INPUT -i lo -j ACCEPT
  
  # Allow SSH
  iptables -A INPUT -p tcp --dport 22 -j ACCEPT
  
  # Optional: Allow other common services
  # Uncomment lines below as needed
  # iptables -A INPUT -p tcp --dport 80 -j ACCEPT   # HTTP
  # iptables -A INPUT -p tcp --dport 443 -j ACCEPT  # HTTPS
  # iptables -A INPUT -p tcp --dport 3306 -j ACCEPT # MySQL
  # iptables -A INPUT -p udp --dport 1194 -j ACCEPT # OpenVPN
  
  # Save rules (different on various distros)
  if [ -d "/etc/iptables" ]; then
    iptables-save > /etc/iptables/rules.v4
  elif [ -x "$(command -v iptables-save)" ]; then
    iptables-save > /etc/iptables.rules
    echo "iptables-restore < /etc/iptables.rules" > /etc/network/if-pre-up.d/iptables
    chmod +x /etc/network/if-pre-up.d/iptables
  else
    echo "Warning: Could not save iptables rules permanently."
    echo "Rules will be lost after reboot."
  fi
  
  echo "iptables firewall configured successfully."
  iptables -L -v
  
else
  echo "Error: No supported firewall (UFW or iptables) found."
  exit 1
fi

exit 0
`
  }
];

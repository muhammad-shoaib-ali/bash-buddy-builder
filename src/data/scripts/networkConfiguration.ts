
import { BoilerplateScript } from '@/types/scripts';

export const networkConfigurationScripts: BoilerplateScript[] = [
  {
    id: "check-open-ports",
    name: "Check Open Ports",
    description: "Lists all open ports and the processes using them",
    category: "network-configuration",
    template: `#!/bin/bash

# Check Open Ports Script
# Description: Shows all open ports and associated processes
# Usage: ./check_open_ports.sh

echo "Checking open ports and listening services..."

# Check which command is available
if command -v ss &> /dev/null; then
  echo "Using ss command:"
  ss -tuln
elif command -v netstat &> /dev/null; then
  echo "Using netstat command:"
  netstat -tuln
else
  echo "Error: Neither ss nor netstat command is available."
  exit 1
fi

# Show processes using the ports
echo -e "\nProcesses using ports:"
if command -v lsof &> /dev/null; then
  lsof -i -P -n | grep LISTEN
else
  echo "lsof command not available. Cannot show processes."
fi

exit 0
`
  },
  {
    id: "ping-test",
    name: "Ping Test with Report",
    description: "Pings a host and generates a simple report",
    category: "network-configuration",
    template: `#!/bin/bash

# Ping Test with Report Script
# Description: Pings a host and generates a simple report
# Usage: ./ping_test.sh [host] [count]

# Set host and count
HOST=\${1:-"google.com"}
COUNT=\${2:-10}

echo "Running ping test to $HOST ($COUNT packets)..."

# Create output file
OUTPUT_FILE="ping_report_$(date +%Y%m%d_%H%M%S).txt"

# Run ping and save to file
ping -c $COUNT $HOST | tee $OUTPUT_FILE

# Calculate statistics
PACKETS_SENT=$(grep "packets transmitted" $OUTPUT_FILE | awk '{print $1}')
PACKETS_RECEIVED=$(grep "packets transmitted" $OUTPUT_FILE | awk '{print $4}')
PACKET_LOSS=$(grep "packet loss" $OUTPUT_FILE | awk '{print $7}')
RTT=$(grep "rtt" $OUTPUT_FILE | awk -F'/' '{print "min="$4"ms avg="$5"ms max="$6"ms"}')

# Generate report
echo -e "\nPing Test Report" > ping_report.txt
echo "----------------" >> ping_report.txt
echo "Host: $HOST" >> ping_report.txt
echo "Packets sent: $PACKETS_SENT" >> ping_report.txt
echo "Packets received: $PACKETS_RECEIVED" >> ping_report.txt
echo "Packet loss: $PACKET_LOSS" >> ping_report.txt
echo "Round Trip Time: $RTT" >> ping_report.txt
echo "----------------" >> ping_report.txt
echo "Test completed at: $(date)" >> ping_report.txt

echo "Ping test completed. Report saved to ping_report.txt"
exit 0
`
  },
  {
    id: "configure-static-ip",
    name: "Configure Static IP",
    description: "Sets up a static IP address for a network interface",
    category: "network-configuration",
    template: `#!/bin/bash

# Configure Static IP Script
# Description: Sets up a static IP address for a network interface
# Usage: ./configure_static_ip.sh [interface] [ip_address] [netmask] [gateway]

# Set network parameters
INTERFACE=\${1:-"eth0"}
IP_ADDRESS=\${2:-"192.168.1.100"}
NETMASK=\${3:-"255.255.255.0"}
GATEWAY=\${4:-"192.168.1.1"}
DNS1="8.8.8.8"
DNS2="8.8.4.4"

echo "Configuring static IP for $INTERFACE..."
echo "IP Address: $IP_ADDRESS"
echo "Netmask: $NETMASK"
echo "Gateway: $GATEWAY"
echo "DNS: $DNS1, $DNS2"

# Back up existing config
if [ -f "/etc/network/interfaces" ]; then
  cp /etc/network/interfaces /etc/network/interfaces.bak
  echo "Backed up current network configuration to /etc/network/interfaces.bak"
fi

# Create new config
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
    netmask $NETMASK
    gateway $GATEWAY
    dns-nameservers $DNS1 $DNS2
EOF

# Apply new config
sudo mv /tmp/interfaces /etc/network/interfaces

echo "Static IP configuration complete."
echo "You may need to restart the networking service with: sudo systemctl restart networking"
exit 0
`
  }
];

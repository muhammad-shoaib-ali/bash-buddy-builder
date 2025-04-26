
import { BoilerplateScript } from '@/types/scripts';

export const devopsScripts: BoilerplateScript[] = [
  {
    id: "terraform-aws",
    name: "Terraform AWS Infrastructure",
    description: "Creates basic AWS infrastructure using Terraform",
    category: "devops",
    template: `# Configure AWS Provider
provider "aws" {
  region = "us-west-2"
}

# Create VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  
  tags = {
    Name = "Main VPC"
  }
}

# Create Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "Main IGW"
  }
}

# Create Public Subnet
resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"

  tags = {
    Name = "Public Subnet"
  }
}

# Create Security Group
resource "aws_security_group" "allow_web" {
  name        = "allow_web_traffic"
  description = "Allow web inbound traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "allow_web"
  }
}`
  },
  {
    id: "ansible-config",
    name: "Ansible Configuration Generator",
    description: "Creates Ansible playbook for server configuration",
    category: "devops",
    template: `---
- name: Configure Web Server
  hosts: webservers
  become: yes
  tasks:
    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600

    - name: Install required packages
      apt:
        name: 
          - nginx
          - docker.io
          - python3-pip
        state: present

    - name: Start and enable services
      service:
        name: "{{ item }}"
        state: started
        enabled: yes
      loop:
        - nginx
        - docker

    - name: Copy nginx config
      template:
        src: templates/nginx.conf.j2
        dest: /etc/nginx/nginx.conf
      notify: restart nginx

  handlers:
    - name: restart nginx
      service:
        name: nginx
        state: restarted`
  },
  {
    id: "ssh-key-generator",
    name: "SSH Key Deployment Script",
    description: "Generates and deploys SSH keys to remote servers",
    category: "devops",
    template: `#!/bin/bash

# SSH Key Generation and Deployment Script
# Description: Generates SSH key pair and deploys to remote servers
# Usage: ./ssh_key_deploy.sh [key_name] [remote_servers_file]

KEY_NAME=\${1:-"$HOME/.ssh/id_rsa"}
SERVERS_FILE=\${2:-"servers.txt"}

# Function to check if a key already exists
check_existing_key() {
  if [ -f "$KEY_NAME" ]; then
    echo "SSH key already exists at $KEY_NAME"
    read -p "Do you want to overwrite it? (y/N) " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "Operation cancelled."
      exit 0
    fi
  fi
}

# Function to generate a new SSH key pair
generate_key_pair() {
  echo "Generating new SSH key pair: $KEY_NAME"
  
  # Create .ssh directory if it doesn't exist
  mkdir -p "$(dirname "$KEY_NAME")"
  
  # Generate key pair without passphrase
  ssh-keygen -t ed25519 -f "$KEY_NAME" -N ""
  
  if [ $? -ne 0 ]; then
    echo "Error: Failed to generate SSH key pair."
    exit 1
  fi
  
  echo "SSH key pair generated successfully."
  echo "Private key: $KEY_NAME"
  echo "Public key: $KEY_NAME.pub"
}

# Function to deploy public key to remote servers
deploy_key() {
  if [ ! -f "$SERVERS_FILE" ]; then
    echo "Error: Servers file $SERVERS_FILE not found."
    echo "Create a file with one server per line in format: user@hostname"
    exit 1
  fi
  
  echo "Deploying public key to servers listed in $SERVERS_FILE..."
  
  # Read each server from the file
  while IFS= read -r server || [ -n "$server" ]; do
    # Skip empty lines and comments
    [[ -z "$server" || "$server" == \#* ]] && continue
    
    echo "Deploying to $server..."
    
    # Copy the public key to the remote server
    ssh-copy-id -i "$KEY_NAME.pub" "$server"
    
    if [ $? -eq 0 ]; then
      echo "✅ Key deployed successfully to $server"
    else
      echo "❌ Failed to deploy key to $server"
    fi
  done < "$SERVERS_FILE"
  
  echo "Key deployment completed."
}

# Function to test SSH connection
test_connections() {
  echo "Testing SSH connections..."
  
  while IFS= read -r server || [ -n "$server" ]; do
    # Skip empty lines and comments
    [[ -z "$server" || "$server" == \#* ]] && continue
    
    echo "Testing connection to $server..."
    
    # Try to connect using the new key
    ssh -i "$KEY_NAME" -o BatchMode=yes -o ConnectTimeout=5 "$server" "echo SSH connection successful"
    
    if [ $? -eq 0 ]; then
      echo "✅ Connection successful to $server"
    else
      echo "❌ Connection failed to $server"
    fi
  done < "$SERVERS_FILE"
  
  echo "Connection testing completed."
}

# Main execution flow
check_existing_key
generate_key_pair
deploy_key
test_connections

echo "SSH key deployment process completed."
exit 0`
  },
  {
    id: "git-log-summary",
    name: "Git Log to Markdown Report",
    description: "Creates a Markdown report from Git commit history",
    category: "devops",
    template: `#!/bin/bash

# Git Log to Markdown Report Generator
# Description: Creates a formatted Markdown report from Git commit history
# Usage: ./git_log_report.sh [repo_dir] [days] [output_file]

REPO_DIR=\${1:-$(pwd)}
DAYS=\${2:-7}
OUTPUT_FILE=\${3:-"git_report.md"}

# Check if we're in a git repository
cd "$REPO_DIR" || exit 1
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "Error: $REPO_DIR is not a Git repository."
  exit 1
fi

# Get repository name
REPO_NAME=$(basename -s .git "$(git config --get remote.origin.url 2>/dev/null || echo "Local Repository")")

# Get current branch
CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "detached HEAD")

echo "Generating Git activity report for repository: $REPO_NAME"
echo "Branch: $CURRENT_BRANCH"
echo "Period: Last $DAYS days"
echo "Output file: $OUTPUT_FILE"

# Calculate the date for filtering
SINCE_DATE=$(date -d "$DAYS days ago" "+%Y-%m-%d")

# Start building the report
cat > "$OUTPUT_FILE" << EOF
# Git Activity Report

**Repository:** $REPO_NAME  
**Branch:** $CURRENT_BRANCH  
**Period:** Last $DAYS days (since $SINCE_DATE)  
**Generated:** $(date "+%Y-%m-%d %H:%M:%S")

## Commits

| Date | Author | Commit | Message |
|------|--------|--------|---------|
EOF

# Add commits to the report
git log --since="$SINCE_DATE" --pretty=format:"| %ad | %an | %h | %s |" --date=short >> "$OUTPUT_FILE"

# Add statistics section
cat >> "$OUTPUT_FILE" << EOF

## Statistics

### Commit Count by Author

\`\`\`
$(git shortlog -s -n --since="$SINCE_DATE")
\`\`\`

### Files Changed

\`\`\`
$(git diff --stat --since="$SINCE_DATE" | tail -n 1)
\`\`\`

### Most Active Files

\`\`\`
$(git log --since="$SINCE_DATE" --name-only --pretty=format: | sort | uniq -c | sort -rn | head -10)
\`\`\`

## Recent Tags

\`\`\`
$(git tag --sort=-creatordate | head -5)
\`\`\`

EOF

echo "Git activity report generated successfully: $OUTPUT_FILE"
exit 0`
  }
];

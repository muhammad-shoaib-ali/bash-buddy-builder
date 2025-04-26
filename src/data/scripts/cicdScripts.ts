
import { BoilerplateScript } from '@/types/scripts';

export const cicdScripts: BoilerplateScript[] = [
  {
    id: "jenkins-pipeline",
    name: "Jenkins Pipeline Generator",
    description: "Creates a basic Jenkins pipeline for CI/CD",
    category: "cicd",
    template: `pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = 'your-docker-image:latest'
        DOCKER_REGISTRY = 'your-registry'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm install'
                sh 'npm run build'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm run test'
            }
        }
        
        stage('Docker Build') {
            steps {
                sh "docker build -t \${DOCKER_IMAGE} ."
            }
        }
        
        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    sh "echo \${DOCKER_PASSWORD} | docker login -u \${DOCKER_USERNAME} --password-stdin"
                    sh "docker push \${DOCKER_IMAGE}"
                }
            }
        }
        
        stage('Deploy') {
            steps {
                sh 'kubectl apply -f k8s/'
            }
        }
    }
    
    post {
        always {
            sh 'docker logout'
        }
    }
}`
  },
  {
    id: "github-actions-workflow",
    name: "GitHub Actions Workflow",
    description: "Generates a GitHub Actions workflow for CI/CD",
    category: "cicd",
    template: `name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install Dependencies
      run: npm install
      
    - name: Run Tests
      run: npm test
      
    - name: Build
      run: npm run build
      
    - name: Login to Docker Hub
      uses: docker/login-action@v1
      with:
        username: \${{ secrets.DOCKER_HUB_USERNAME }}
        password: \${{ secrets.DOCKER_HUB_TOKEN }}
        
    - name: Build and Push Docker image
      uses: docker/build-push-action@v2
      with:
        push: true
        tags: user/app:latest
        
    - name: Deploy to Kubernetes
      uses: steebchen/kubectl@v2
      with:
        config: \${{ secrets.KUBE_CONFIG_DATA }}
        command: apply -f k8s/deployment.yaml`
  },
  {
    id: "git-pull-deploy",
    name: "Git Pull & Deploy Script",
    description: "Pulls latest code and deploys via SSH",
    category: "cicd",
    template: `#!/bin/bash

# Git Pull and Deploy Script
# Description: Pulls latest code from a Git repository and deploys it to a server
# Usage: ./git_pull_deploy.sh [repo_dir] [branch] [remote_server] [remote_dir]

REPO_DIR=\${1:-"/path/to/local/repo"}
BRANCH=\${2:-"main"}
REMOTE_SERVER=\${3:-"user@remote-server.com"}
REMOTE_DIR=\${4:-"/var/www/app"}

# Check if repository directory exists
if [ ! -d "$REPO_DIR" ]; then
  echo "Error: Repository directory $REPO_DIR does not exist."
  exit 1
fi

# Navigate to repository directory
cd "$REPO_DIR" || exit 1

echo "Starting deployment process..."
echo "Repository: $REPO_DIR"
echo "Branch: $BRANCH"
echo "Remote server: $REMOTE_SERVER"
echo "Remote directory: $REMOTE_DIR"

# Pull latest code from repository
echo "Pulling latest code from $BRANCH branch..."
git fetch --all
git checkout "$BRANCH"
git pull origin "$BRANCH"

if [ $? -ne 0 ]; then
  echo "Error: Failed to pull latest code from repository."
  exit 1
fi

# Build the application (example for Node.js)
echo "Building application..."
npm install
npm run build

if [ $? -ne 0 ]; then
  echo "Error: Build failed."
  exit 1
fi

# Copy build files to remote server
echo "Copying build files to remote server..."
scp -r ./build/* "$REMOTE_SERVER":"$REMOTE_DIR"

if [ $? -ne 0 ]; then
  echo "Error: Failed to copy files to remote server."
  exit 1
fi

# Optional: Restart services on remote server
echo "Restarting services on remote server..."
ssh "$REMOTE_SERVER" "cd $REMOTE_DIR && ./restart.sh"

if [ $? -ne 0 ]; then
  echo "Warning: Failed to restart services on remote server."
fi

echo "Deployment completed successfully!"
exit 0`
  },
  {
    id: "notify-slack-deployment",
    name: "Slack Deployment Notification",
    description: "Sends deployment status to Slack",
    category: "cicd",
    template: `#!/bin/bash

# Slack Deployment Notification Script
# Description: Sends deployment status notifications to a Slack channel
# Usage: ./notify_slack.sh [status] [project] [version] [webhook_url]

STATUS=\${1:-"success"}  # success, failed, or started
PROJECT=\${2:-"My Project"}
VERSION=\${3:-"1.0.0"}
WEBHOOK_URL=\${4:-"https://hooks.slack.com/services/YOUR/WEBHOOK/URL"}

# Get current timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Set emoji and color based on status
if [ "$STATUS" == "success" ]; then
  EMOJI=":white_check_mark:"
  COLOR="#36a64f"
  TITLE="Deployment Successful"
elif [ "$STATUS" == "failed" ]; then
  EMOJI=":x:"
  COLOR="#dc3545"
  TITLE="Deployment Failed"
else
  EMOJI=":rocket:"
  COLOR="#6f42c1"
  TITLE="Deployment Started"
fi

# Get Git info if available
if command -v git &> /dev/null && git rev-parse --is-inside-work-tree &> /dev/null; then
  COMMIT_HASH=$(git rev-parse --short HEAD)
  COMMIT_MSG=$(git log -1 --pretty=%B)
  BRANCH=$(git symbolic-ref --short HEAD)
  COMMITTER=$(git log -1 --pretty=format:'%an')
  
  GIT_INFO="*Branch:* \`$BRANCH\`
*Commit:* \`$COMMIT_HASH\` - $COMMIT_MSG
*Author:* $COMMITTER"
else
  GIT_INFO="*Version:* $VERSION"
fi

# Construct the JSON payload
read -r -d '' PAYLOAD << EOF
{
  "attachments": [
    {
      "color": "$COLOR",
      "pretext": "$EMOJI $TITLE",
      "title": "$PROJECT Deployment",
      "title_link": "https://your-ci-system.example.com/jobs/123",
      "text": "$GIT_INFO",
      "fields": [
        {
          "title": "Status",
          "value": "$STATUS",
          "short": true
        },
        {
          "title": "Environment",
          "value": "\${ENVIRONMENT:-production}",
          "short": true
        }
      ],
      "footer": "Deployment Notification",
      "ts": $(date +%s)
    }
  ]
}
EOF

# Send the notification to Slack
curl -s -X POST -H 'Content-type: application/json' --data "$PAYLOAD" "$WEBHOOK_URL"

echo "Slack notification sent."
exit 0`
  },
  {
    id: "yaml-validator",
    name: "YAML/Docker Compose Validator",
    description: "Validates YAML files and Docker Compose configs",
    category: "cicd",
    template: `#!/bin/bash

# YAML and Docker Compose Validator Script
# Description: Validates YAML files and Docker Compose configurations
# Usage: ./validate_yaml.sh [file_or_directory]

TARGET=\${1:-"."}

# Check if yamllint is installed
if ! command -v yamllint &> /dev/null; then
  echo "Warning: 'yamllint' not found. Basic validation will be performed."
  HAS_YAMLLINT=false
else
  HAS_YAMLLINT=true
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
  echo "Warning: 'docker-compose' not found. Docker Compose validation will be skipped."
  HAS_DOCKER_COMPOSE=false
else
  HAS_DOCKER_COMPOSE=true
fi

# Function to validate a single YAML file
validate_yaml() {
  local file=$1
  echo "Validating: $file"
  
  # Basic syntax check using Python (available on most systems)
  python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null
  
  if [ $? -ne 0 ]; then
    echo "❌ YAML syntax error in $file"
    python3 -c "import yaml; yaml.safe_load(open('$file'))"
    return 1
  else
    echo "✅ YAML syntax OK"
    
    # Additional validation with yamllint if available
    if [ "$HAS_YAMLLINT" = true ]; then
      yamllint -f parsable "$file"
      if [ $? -ne 0 ]; then
        echo "❌ YAML lint issues found (but file is valid)"
      else
        echo "✅ YAML lint passed"
      fi
    fi
    
    # Check if it's a Docker Compose file
    if [ "$HAS_DOCKER_COMPOSE" = true ] && [[ "$file" == *"docker-compose"* || "$file" == *"compose.yaml"* || "$file" == *"compose.yml"* ]]; then
      echo "Validating as Docker Compose file..."
      docker-compose -f "$file" config > /dev/null
      
      if [ $? -ne 0 ]; then
        echo "❌ Docker Compose validation failed"
        return 1
      else
        echo "✅ Docker Compose validation passed"
      fi
    fi
    
    return 0
  fi
}

# Main validation logic
if [ -f "$TARGET" ]; then
  # Single file validation
  if [[ "$TARGET" == *.yaml || "$TARGET" == *.yml ]]; then
    validate_yaml "$TARGET"
    exit $?
  else
    echo "Error: $TARGET is not a YAML file (.yaml or .yml extension required)."
    exit 1
  fi
elif [ -d "$TARGET" ]; then
  # Directory validation
  echo "Validating all YAML files in $TARGET..."
  
  ERRORS=0
  FILES_CHECKED=0
  
  while IFS= read -r -d '' file; do
    validate_yaml "$file"
    if [ $? -ne 0 ]; then
      ERRORS=$((ERRORS+1))
    fi
    FILES_CHECKED=$((FILES_CHECKED+1))
    echo "-------------------------------------------"
  done < <(find "$TARGET" -type f \( -name "*.yaml" -o -name "*.yml" \) -print0)
  
  echo "Validation complete: $FILES_CHECKED files checked, $ERRORS files with errors."
  
  if [ $ERRORS -gt 0 ]; then
    exit 1
  else
    exit 0
  fi
else
  echo "Error: $TARGET is not a valid file or directory."
  exit 1
fi`
  }
];

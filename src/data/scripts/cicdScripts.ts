
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
  }
];

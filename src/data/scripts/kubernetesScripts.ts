
import { BoilerplateScript } from '@/types/scripts';

export const kubernetesScripts: BoilerplateScript[] = [
  {
    id: "k8s-deployment",
    name: "Kubernetes Deployment Generator",
    description: "Creates a basic Kubernetes deployment with service",
    category: "kubernetes",
    template: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: your-image:latest
        ports:
        - containerPort: 80
        resources:
          limits:
            cpu: "1"
            memory: "512Mi"
          requests:
            cpu: "0.5"
            memory: "256Mi"
---
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: myapp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: LoadBalancer`
  },
  {
    id: "k8s-monitoring",
    name: "Kubernetes Monitoring Setup",
    description: "Installs Prometheus and Grafana monitoring stack",
    category: "kubernetes",
    template: `#!/bin/bash

# Add Helm repos
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Create monitoring namespace
kubectl create namespace monitoring

# Install Prometheus
helm install prometheus prometheus-community/prometheus \\
  --namespace monitoring \\
  --set alertmanager.persistentVolume.enabled=false \\
  --set server.persistentVolume.enabled=false

# Install Grafana
helm install grafana grafana/grafana \\
  --namespace monitoring \\
  --set persistence.enabled=false \\
  --set adminPassword=admin

# Wait for pods to be ready
kubectl wait --for=condition=ready pod \\
  --selector=app=prometheus \\
  --namespace monitoring \\
  --timeout=300s

# Get Grafana admin password
echo "Grafana admin password: $(kubectl get secret \\
  --namespace monitoring grafana \\
  -o jsonpath="{.data.admin-password}" \\
  | base64 --decode)"`
  },
  {
    id: "k8s-get-resources",
    name: "Get All K8s Resources",
    description: "Lists all pods, services and deployments in a namespace",
    category: "kubernetes",
    template: `#!/bin/bash

# Kubernetes Resource Lister
# Description: Lists pods, services, and deployments in a namespace
# Usage: ./k8s_resources.sh [namespace]

NAMESPACE=\${1:-"default"}

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
  echo "Error: kubectl is not installed or not in PATH."
  exit 1
fi

# Check if namespace exists
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
  echo "Error: Namespace '$NAMESPACE' does not exist."
  exit 1
fi

echo "=== Kubernetes Resources in Namespace: $NAMESPACE ==="
echo ""

# List Pods
echo "=== PODS ==="
kubectl get pods -n "$NAMESPACE" -o wide
echo ""

# List Services
echo "=== SERVICES ==="
kubectl get services -n "$NAMESPACE"
echo ""

# List Deployments
echo "=== DEPLOYMENTS ==="
kubectl get deployments -n "$NAMESPACE"
echo ""

# List StatefulSets
echo "=== STATEFULSETS ==="
kubectl get statefulsets -n "$NAMESPACE"
echo ""

# List ConfigMaps
echo "=== CONFIGMAPS ==="
kubectl get configmaps -n "$NAMESPACE"
echo ""

# List Secrets
echo "=== SECRETS ==="
kubectl get secrets -n "$NAMESPACE"
echo ""

# Resource usage
echo "=== RESOURCE USAGE ==="
echo "CPU and Memory usage by Pod:"
kubectl top pod -n "$NAMESPACE"
echo ""

exit 0`
  },
  {
    id: "k8s-restart-deployment",
    name: "Restart K8s Deployment",
    description: "Safely restarts a Kubernetes deployment",
    category: "kubernetes",
    template: `#!/bin/bash

# Kubernetes Deployment Restart Script
# Description: Safely restarts a Kubernetes deployment
# Usage: ./k8s_restart_deployment.sh [deployment_name] [namespace]

DEPLOYMENT=\${1:-""}
NAMESPACE=\${2:-"default"}

# Check if deployment name is provided
if [ -z "$DEPLOYMENT" ]; then
  echo "Error: No deployment name specified."
  echo "Usage: $0 [deployment_name] [namespace]"
  exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
  echo "Error: kubectl is not installed or not in PATH."
  exit 1
fi

# Check if deployment exists
if ! kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" &> /dev/null; then
  echo "Error: Deployment '$DEPLOYMENT' not found in namespace '$NAMESPACE'."
  exit 1
fi

echo "Restarting deployment '$DEPLOYMENT' in namespace '$NAMESPACE'..."

# Method 1: Using rollout restart (Kubernetes 1.15+)
echo "Using 'kubectl rollout restart' method..."
kubectl rollout restart deployment/"$DEPLOYMENT" -n "$NAMESPACE"

# Wait for rollout to complete
echo "Waiting for rollout to complete..."
kubectl rollout status deployment/"$DEPLOYMENT" -n "$NAMESPACE"

if [ $? -eq 0 ]; then
  echo "✅ Deployment restarted successfully."
else
  echo "❌ Deployment restart failed."
  exit 1
fi

echo "Current status of deployment:"
kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE"

exit 0`
  },
  {
    id: "k8s-delete-evicted",
    name: "Delete Evicted Pods",
    description: "Finds and deletes all evicted or failed pods",
    category: "kubernetes",
    template: `#!/bin/bash

# Delete Evicted/Failed Pods Script
# Description: Finds and deletes all evicted or failed pods
# Usage: ./delete_evicted_pods.sh [namespace]

NAMESPACE=\${1:-"--all-namespaces"}

if [ "$NAMESPACE" != "--all-namespaces" ]; then
  NAMESPACE="-n $NAMESPACE"
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
  echo "Error: kubectl is not installed or not in PATH."
  exit 1
fi

echo "Finding evicted and failed pods $NAMESPACE..."

# Find evicted pods
EVICTED_PODS=$(kubectl get pods $NAMESPACE | grep "Evicted" | awk '{print $1 " -n " $2}')
FAILED_PODS=$(kubectl get pods $NAMESPACE | grep "Error\\|CrashLoopBackOff" | awk '{print $1 " -n " $2}')

# Count pods found
EVICTED_COUNT=$(echo "$EVICTED_PODS" | grep -c "^")
FAILED_COUNT=$(echo "$FAILED_PODS" | grep -c "^")

if [ "$EVICTED_COUNT" -eq 0 ] && [ "$FAILED_COUNT" -eq 0 ]; then
  echo "No evicted or failed pods found."
  exit 0
fi

echo "Found $EVICTED_COUNT evicted pods and $FAILED_COUNT failed pods."
echo ""

# Confirm deletion
read -p "Do you want to delete these pods? (y/N) " -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Operation cancelled."
  exit 0
fi

# Delete evicted pods
echo "Deleting evicted pods..."
if [ "$EVICTED_COUNT" -gt 0 ]; then
  echo "$EVICTED_PODS" | while read -r POD_INFO; do
    if [ -n "$POD_INFO" ]; then
      echo "Deleting pod: $POD_INFO"
      kubectl delete pod $POD_INFO
    fi
  done
fi

# Delete failed pods
echo "Deleting failed pods..."
if [ "$FAILED_COUNT" -gt 0 ]; then
  echo "$FAILED_PODS" | while read -r POD_INFO; do
    if [ -n "$POD_INFO" ]; then
      echo "Deleting pod: $POD_INFO"
      kubectl delete pod $POD_INFO
    fi
  done
fi

echo "Done. Deleted $EVICTED_COUNT evicted pods and $FAILED_COUNT failed pods."
exit 0`
  }
];

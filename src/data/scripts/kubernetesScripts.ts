
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
  }
];

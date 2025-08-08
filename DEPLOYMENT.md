# 🚀 Plaggona Metaverse - Production Deployment Guide

This guide covers deploying the Plaggona Metaverse to Kubernetes using Docker and Helm.

## 📋 Prerequisites

### Required Software
- **Docker**: For building container images
- **MicroK8s**: Kubernetes distribution with registry
- **Helm 3**: Package manager for Kubernetes
- **Node.js 18+**: For local development

### MicroK8s Setup
```bash
# Install MicroK8s (if not already installed)
sudo snap install microk8s --classic

# Enable required addons
microk8s enable dns dashboard storage registry ingress helm3

# Add yourself to microk8s group
sudo usermod -a -G microk8s $USER
newgrp microk8s

# Verify installation
microk8s status
```

## 🏗️ Docker Configuration

### Optimized Dockerfile Features
- **Multi-stage build**: Optimized for production
- **Alpine Linux**: Minimal base image (~50MB)
- **Non-root user**: Enhanced security with user `plaggona:nodejs`
- **Health checks**: Built-in container health monitoring
- **Production dependencies**: Only runtime dependencies installed

### Security Features
- Read-only root filesystem compatible
- Runs as non-privileged user (UID 1001)
- Minimal attack surface with Alpine
- Security context enforcement

## 🎯 Kubernetes Configuration

### Helm Chart Features

#### High Availability
- **Horizontal Pod Autoscaler**: Scales 2-10 pods based on CPU/memory
- **Pod Disruption Budget**: Ensures at least 1 pod always running
- **Pod Anti-Affinity**: Spreads pods across different nodes
- **Resource Limits**: CPU and memory constraints

#### Networking
- **Service**: ClusterIP with proper port mapping
- **Ingress**: TLS-enabled with multiple domains
- **WebSocket Support**: Traefik middleware for Socket.IO

#### Monitoring & Health
- **Liveness Probe**: Checks `/api/users` endpoint
- **Readiness Probe**: Ensures pod is ready for traffic
- **Prometheus Annotations**: Metrics collection ready

#### Security
- **Pod Security Context**: Non-root execution
- **Security Context**: Drop all capabilities
- **Service Account**: Dedicated RBAC

## 🚀 Deployment Options

### Option 1: Automated Deployment (Recommended)
```bash
# Run the deployment script
./deploy.sh
```

This script will:
1. Build the Docker image
2. Push to local registry
3. Package Helm chart
4. Deploy/upgrade Kubernetes release
5. Wait for readiness
6. Show deployment status

### Option 2: Manual Deployment

#### Step 1: Build and Push Image
```bash
# Build the Docker image
docker build -t localhost:32000/plaggona-metaverse:latest .

# Push to MicroK8s registry
docker push localhost:32000/plaggona-metaverse:latest
```

#### Step 2: Deploy with Helm
```bash
# Package the chart
cd charts
microk8s.helm3 package -d ./plaggona-k8s ./plaggona-k8s

# Install/upgrade
microk8s.helm3 install plaggona-metaverse -n default \
    ./plaggona-k8s/plaggona-k8s-0.1.0.tgz \
    --wait --timeout=300s
```

## 🔧 Configuration Options

### Environment Variables
The deployment supports these environment variables:

```yaml
env:
  - name: NODE_ENV
    value: "production"
  - name: PORT
    value: "3000"
  - name: LOG_LEVEL
    value: "info"
```

### Resource Customization
```yaml
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 200m
    memory: 256Mi
```

### Autoscaling Configuration
```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

## 🌐 Domain Configuration

### Supported Domains
- `plaggona.com`
- `www.plaggona.com`

### TLS Configuration
The Helm chart is configured for Traefik with Let's Encrypt:

```yaml
ingress:
  annotations:
    traefik.ingress.kubernetes.io/router.tls: "true"
    traefik.ingress.kubernetes.io/router.tls.certresolver: leresolver
    traefik.ingress.kubernetes.io/router.middlewares: default-websocket@kubernetescrd
```

## 📊 Monitoring & Operations

### Viewing Logs
```bash
# Stream logs from all pods
microk8s.kubectl logs -f deployment/plaggona-metaverse

# View logs from specific pod
microk8s.kubectl logs -f pod/<pod-name>
```

### Scaling
```bash
# Scale to 5 replicas
microk8s.kubectl scale deployment/plaggona-metaverse --replicas=5

# Auto-scaling status
microk8s.kubectl get hpa
```

### Health Checks
```bash
# Check pod status
microk8s.kubectl get pods -l app.kubernetes.io/name=plaggona-k8s

# Check service endpoints
microk8s.kubectl get endpoints plaggona-metaverse

# Test health endpoint
curl https://plaggona.com/api/users
```

### Resource Usage
```bash
# Pod resource usage
microk8s.kubectl top pods

# Node resource usage
microk8s.kubectl top nodes
```

## 🔄 Updates & Maintenance

### Rolling Updates
```bash
# Update with new image
microk8s.helm3 upgrade plaggona-metaverse \
    ./charts/plaggona-k8s/plaggona-k8s-0.1.0.tgz \
    --set image.tag=v1.1.0

# Check rollout status
microk8s.kubectl rollout status deployment/plaggona-metaverse
```

### Rollback
```bash
# View rollout history
microk8s.helm3 history plaggona-metaverse

# Rollback to previous version
microk8s.helm3 rollback plaggona-metaverse 1
```

### Backup Configuration
```bash
# Export current configuration
microk8s.helm3 get values plaggona-metaverse > current-values.yaml

# Use backup for deployment
microk8s.helm3 upgrade plaggona-metaverse ./chart.tgz -f current-values.yaml
```

## 🛠️ Troubleshooting

### Common Issues

#### Image Pull Errors
```bash
# Check if image exists in registry
curl http://localhost:32000/v2/plaggona-metaverse/tags/list

# Rebuild and push
docker build -t localhost:32000/plaggona-metaverse:latest .
docker push localhost:32000/plaggona-metaverse:latest
```

#### Pod Startup Issues
```bash
# Describe pod for events
microk8s.kubectl describe pod <pod-name>

# Check container logs
microk8s.kubectl logs <pod-name> -c plaggona-k8s
```

#### Network Issues
```bash
# Test service connectivity
microk8s.kubectl run test-pod --image=busybox --rm -it -- wget -qO- http://plaggona-metaverse:3000/api/users

# Check ingress
microk8s.kubectl get ingress plaggona-metaverse -o yaml
```

### Performance Tuning

#### For High Load
```yaml
# Increase resources
resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 500m
    memory: 512Mi

# Scale up
autoscaling:
  minReplicas: 5
  maxReplicas: 20
  targetCPUUtilizationPercentage: 60
```

#### For Development
```yaml
# Reduce resources
resources:
  requests:
    cpu: 100m
    memory: 128Mi

# Single replica
replicaCount: 1
autoscaling:
  enabled: false
```

## 🧪 Development Workflow

### Local Development
```bash
# Start development server
./dev.sh

# Or manually
npm install
npm run dev
```

### Testing Changes
```bash
# Build test image
docker build -t localhost:32000/plaggona-metaverse:test .

# Deploy test version
microk8s.helm3 upgrade plaggona-metaverse ./chart.tgz \
    --set image.tag=test
```

## 📈 Production Checklist

Before deploying to production:

- [ ] SSL certificates configured
- [ ] Domain DNS pointing to cluster
- [ ] Resource limits appropriate for expected load  
- [ ] Monitoring and alerting configured
- [ ] Backup strategy in place
- [ ] Security contexts properly configured
- [ ] Health checks responding correctly
- [ ] Load testing completed
- [ ] Disaster recovery plan documented

## 🎯 Performance Metrics

Expected performance characteristics:

- **Startup Time**: < 30 seconds
- **Memory Usage**: 256-512MB per pod
- **CPU Usage**: 200-500m per pod
- **Concurrent Users**: 100-500 per pod
- **Response Time**: < 100ms for API endpoints
- **WebSocket Latency**: < 50ms

## 📞 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review Kubernetes events: `microk8s.kubectl get events --sort-by=.metadata.creationTimestamp`
3. Check application logs: `microk8s.kubectl logs -f deployment/plaggona-metaverse`
4. Contact: panagiotis@skarvelis.gr

---

**🌍 Welcome to the production-ready Plaggona Metaverse deployment! 🚀**

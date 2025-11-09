#!/bin/bash

# Plaggona Metaverse Deployment Script
# This script deploys the Plaggona Metaverse to Kubernetes

set -e

# Configuration
NAMESPACE="default"
RELEASE_NAME="plaggona-metaverse"
CHART_PATH="./charts/plaggona-k8s"
IMAGE_TAG="latest"
REDIS_CHART_PATH="./charts/plagona-redis"
REDIS_RELEASE_NAME="plagona-redis"

DEFAULT_REPLICAS_SINGLE=1
DEFAULT_REPLICAS_MULTI=2

use_redis=false
multi_replica=false
redis_password=""

echo "🌍 Deploying Plaggona Metaverse..."
echo "" 
echo "Choose deployment mode:" 
echo "  1) Single replica (no Redis, simpler, users isolated if you later scale manually)" 
echo "  2) Multi-replica ready (installs Redis adapter backend)" 
read -p "Select [1/2]: " mode_choice
if [[ "$mode_choice" == "2" ]]; then
    use_redis=true
    multi_replica=true
fi

if $use_redis; then
    echo "" 
    if [ ! -d "$REDIS_CHART_PATH" ]; then
        echo "❌ Redis chart path '$REDIS_CHART_PATH' not found. Abort or create the chart."
        exit 1
    fi
    read -p "🔐 Use Redis AUTH password? (enter to skip): " redis_password
    if [[ -n "$redis_password" ]]; then
        echo "Password set (will create secret)."
    else
        echo "No password; deploying Redis without AUTH." 
    fi
fi

# Function to ask user confirmation
ask_user() {
    read -p "$1 [y/N]: " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# Check if there's an existing deployment and ask if user wants to uninstall first
if command -v microk8s.helm3 &> /dev/null; then
    if microk8s.helm3 list -n ${NAMESPACE} | grep -q ${RELEASE_NAME}; then
        echo "⚠️  Existing deployment of '${RELEASE_NAME}' found."
        echo "📋 Current deployment status:"
        microk8s.kubectl get pods -n ${NAMESPACE} -l "app.kubernetes.io/instance=${RELEASE_NAME}" --no-headers 2>/dev/null | wc -l | xargs echo "   Pods running:"
        echo ""
        
        if ask_user "🗑️  Do you want to run the uninstall script to clean up the existing deployment first?"; then
            echo "🔄 Running uninstall script..."
            if [ -f "./uninstall.sh" ]; then
                chmod +x ./uninstall.sh
                ./uninstall.sh
                echo ""
                echo "✅ Uninstall completed. Continuing with deployment..."
                echo ""
            else
                echo "❌ Error: uninstall.sh not found in current directory."
                exit 1
            fi
        else
            echo "⏭️  Continuing with deployment (will upgrade existing release)..."
            echo ""
        fi
    fi
fi

# Check if microk8s is available
if ! command -v microk8s.helm3 &> /dev/null; then
    echo "❌ Error: microk8s.helm3 not found. Please install MicroK8s."
    exit 1
fi

# Build and push the Docker image
echo "🔨 Building Docker image..."
docker build -t localhost:32000/plaggona-metaverse:${IMAGE_TAG} .

echo "📤 Pushing Docker image to registry..."
docker push localhost:32000/plaggona-metaverse:${IMAGE_TAG}

# Package the Helm chart
echo "📦 Packaging Helm chart..."
cd charts
microk8s.helm3 package -d ./plaggona-k8s ./plaggona-k8s
cd ..

# Check if release already exists
EXTRA_ARGS=""
if $use_redis; then
    # Install or upgrade Redis first
    echo "🗄️  Deploying Redis backend ($REDIS_RELEASE_NAME)..."
    if microk8s.helm3 list -n ${NAMESPACE} | grep -q ${REDIS_RELEASE_NAME}; then
        if [[ -n "$redis_password" ]]; then
            microk8s.helm3 upgrade ${REDIS_RELEASE_NAME} -n ${NAMESPACE} ${REDIS_CHART_PATH} \
                --set fullnameOverride=${REDIS_RELEASE_NAME} \
                --set auth.enabled=true --set-string auth.password="${redis_password}" --wait --timeout=180s
        else
            microk8s.helm3 upgrade ${REDIS_RELEASE_NAME} -n ${NAMESPACE} ${REDIS_CHART_PATH} \
                --set fullnameOverride=${REDIS_RELEASE_NAME} --wait --timeout=180s
        fi
    else
        if [[ -n "$redis_password" ]]; then
            microk8s.helm3 install ${REDIS_RELEASE_NAME} -n ${NAMESPACE} ${REDIS_CHART_PATH} \
                --set fullnameOverride=${REDIS_RELEASE_NAME} \
                --set auth.enabled=true --set-string auth.password="${redis_password}" --wait --timeout=180s
        else
            microk8s.helm3 install ${REDIS_RELEASE_NAME} -n ${NAMESPACE} ${REDIS_CHART_PATH} \
                --set fullnameOverride=${REDIS_RELEASE_NAME} --wait --timeout=180s
        fi
    fi
    if [[ -n "$redis_password" ]]; then
        EXTRA_ARGS+=" --set env.REDIS_URL=redis://:${redis_password}@${REDIS_RELEASE_NAME}:6379 "
    else
        EXTRA_ARGS+=" --set env.REDIS_URL=redis://${REDIS_RELEASE_NAME}:6379 "
    fi
    EXTRA_ARGS+=" --set autoscaling.enabled=true "
else
    EXTRA_ARGS+=" --set autoscaling.enabled=false --set replicaCount=${DEFAULT_REPLICAS_SINGLE} "
fi

if microk8s.helm3 list -n ${NAMESPACE} | grep -q ${RELEASE_NAME}; then
        echo "⬆️ Upgrading existing release..."
        microk8s.helm3 upgrade ${RELEASE_NAME} -n ${NAMESPACE} ./charts/plaggona-k8s/plaggona-k8s-0.1.0.tgz \
                --set image.tag=${IMAGE_TAG} ${EXTRA_ARGS} \
                --wait --timeout=300s
else
        echo "🚀 Installing new release..."
        microk8s.helm3 install ${RELEASE_NAME} -n ${NAMESPACE} ./charts/plaggona-k8s/plaggona-k8s-0.1.0.tgz \
                --set image.tag=${IMAGE_TAG} ${EXTRA_ARGS} \
                --wait --timeout=300s
fi

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
microk8s.kubectl wait --for=condition=available --timeout=300s deployment/${RELEASE_NAME} -n ${NAMESPACE}

# Show deployment status
echo "✅ Deployment completed successfully!"
if $use_redis; then
    echo "🔌 Redis adapter enabled via REDIS_URL (check server logs for activation)."
else
    echo "ℹ️  Running single-replica mode without Redis (scale cautiously to avoid isolated worlds)."
fi
echo ""
echo "📊 Deployment Status:"
echo "Pods:"
microk8s.kubectl get pods -n ${NAMESPACE} -l "app.kubernetes.io/instance=${RELEASE_NAME}"
echo ""
echo "Services:"
microk8s.kubectl get svc -n ${NAMESPACE} -l "app.kubernetes.io/instance=${RELEASE_NAME}"
echo ""
echo "Ingress:"
microk8s.kubectl get ingress -n ${NAMESPACE} -l "app.kubernetes.io/instance=${RELEASE_NAME}"
echo ""
echo "HPA Status:"
microk8s.kubectl get hpa -n ${NAMESPACE} -l "app.kubernetes.io/instance=${RELEASE_NAME}"
echo ""

echo "🌍 Plaggona Metaverse is now running!"
echo "🔗 Access URLs:"
echo "   - https://plaggona.com"
echo "   - https://www.plaggona.com"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: microk8s.kubectl logs -f deployment/${RELEASE_NAME} -n ${NAMESPACE}"
if $use_redis; then
    echo "   Scale up:  microk8s.kubectl scale deployment/${RELEASE_NAME} --replicas=3 -n ${NAMESPACE}"
else
    echo "   (To enable safe scaling later: redeploy with Redis using ./deploy.sh and choose option 2)"
fi
echo "   Uninstall: microk8s.helm3 uninstall ${RELEASE_NAME} -n ${NAMESPACE}"

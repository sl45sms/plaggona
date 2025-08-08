#!/bin/bash

# Plaggona Metaverse Deployment Script
# This script deploys the Plaggona Metaverse to Kubernetes

set -e

# Configuration
NAMESPACE="default"
RELEASE_NAME="plaggona-metaverse"
CHART_PATH="./charts/plaggona-k8s"
IMAGE_TAG="latest"

echo "🌍 Deploying Plaggona Metaverse..."

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
if microk8s.helm3 list -n ${NAMESPACE} | grep -q ${RELEASE_NAME}; then
    echo "⬆️ Upgrading existing release..."
    microk8s.helm3 upgrade ${RELEASE_NAME} -n ${NAMESPACE} ./charts/plaggona-k8s/plaggona-k8s-0.1.0.tgz \
        --set image.tag=${IMAGE_TAG} \
        --wait --timeout=300s
else
    echo "🚀 Installing new release..."
    microk8s.helm3 install ${RELEASE_NAME} -n ${NAMESPACE} ./charts/plaggona-k8s/plaggona-k8s-0.1.0.tgz \
        --set image.tag=${IMAGE_TAG} \
        --wait --timeout=300s
fi

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
microk8s.kubectl wait --for=condition=available --timeout=300s deployment/${RELEASE_NAME} -n ${NAMESPACE}

# Show deployment status
echo "✅ Deployment completed successfully!"
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
echo "   Scale up:  microk8s.kubectl scale deployment/${RELEASE_NAME} --replicas=3 -n ${NAMESPACE}"
echo "   Uninstall: microk8s.helm3 uninstall ${RELEASE_NAME} -n ${NAMESPACE}"

#!/bin/bash

# Plaggona Metaverse Uninstall Script
# This script safely removes the Plaggona Metaverse from Kubernetes

set -e

# Configuration
NAMESPACE="default"
RELEASE_NAME="plaggona-metaverse"
IMAGE_REGISTRY="localhost:32000"
IMAGE_NAME="plaggona-metaverse"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗑️  Uninstalling Plaggona Metaverse...${NC}"

# Check if microk8s is available
if ! command -v microk8s.helm3 &> /dev/null; then
    echo -e "${RED}❌ Error: microk8s.helm3 not found. Please install MicroK8s.${NC}"
    exit 1
fi

# Function to confirm action
confirm() {
    read -p "$1 [y/N]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⏸️  Operation cancelled.${NC}"
        exit 0
    fi
}

# Check if release exists
if ! microk8s.helm3 list -n ${NAMESPACE} | grep -q ${RELEASE_NAME}; then
    echo -e "${YELLOW}⚠️  Release '${RELEASE_NAME}' not found in namespace '${NAMESPACE}'.${NC}"
    echo "Available releases:"
    microk8s.helm3 list -n ${NAMESPACE}
    exit 0
fi

# Show current deployment status
echo -e "${BLUE}📊 Current Deployment Status:${NC}"
echo ""
microk8s.kubectl get pods -n ${NAMESPACE} -l app.kubernetes.io/name=plaggona-k8s 2>/dev/null || echo "No pods found"
echo ""
microk8s.kubectl get svc -n ${NAMESPACE} -l app.kubernetes.io/name=plaggona-k8s 2>/dev/null || echo "No services found"
echo ""
microk8s.kubectl get ingress -n ${NAMESPACE} -l app.kubernetes.io/name=plaggona-k8s 2>/dev/null || echo "No ingresses found"
echo ""

# Confirm uninstall
confirm "Are you sure you want to uninstall the Plaggona Metaverse deployment?"

# Get deployment info before uninstall
echo -e "${BLUE}📋 Gathering deployment information...${NC}"
PODS_BEFORE=$(microk8s.kubectl get pods -n ${NAMESPACE} -l app.kubernetes.io/name=plaggona-k8s --no-headers 2>/dev/null | wc -l)
SERVICES_BEFORE=$(microk8s.kubectl get svc -n ${NAMESPACE} -l app.kubernetes.io/name=plaggona-k8s --no-headers 2>/dev/null | wc -l)

# Uninstall the Helm release
echo -e "${BLUE}🚀 Uninstalling Helm release '${RELEASE_NAME}'...${NC}"
if microk8s.helm3 uninstall ${RELEASE_NAME} -n ${NAMESPACE}; then
    echo -e "${GREEN}✅ Helm release uninstalled successfully.${NC}"
else
    echo -e "${RED}❌ Failed to uninstall Helm release.${NC}"
    exit 1
fi

# Wait for pods to terminate
echo -e "${BLUE}⏳ Waiting for pods to terminate...${NC}"
timeout=60
while [ $timeout -gt 0 ]; do
    REMAINING_PODS=$(microk8s.kubectl get pods -n ${NAMESPACE} -l app.kubernetes.io/name=plaggona-k8s --no-headers 2>/dev/null | wc -l)
    if [ "$REMAINING_PODS" -eq 0 ]; then
        break
    fi
    echo -n "."
    sleep 2
    timeout=$((timeout-2))
done
echo ""

# Check if any resources are still lingering
echo -e "${BLUE}🔍 Checking for remaining resources...${NC}"
REMAINING_PODS=$(microk8s.kubectl get pods -n ${NAMESPACE} -l app.kubernetes.io/name=plaggona-k8s --no-headers 2>/dev/null | wc -l)
REMAINING_SERVICES=$(microk8s.kubectl get svc -n ${NAMESPACE} -l app.kubernetes.io/name=plaggona-k8s --no-headers 2>/dev/null | wc -l)
REMAINING_INGRESS=$(microk8s.kubectl get ingress -n ${NAMESPACE} -l app.kubernetes.io/name=plaggona-k8s --no-headers 2>/dev/null | wc -l)

if [ "$REMAINING_PODS" -gt 0 ] || [ "$REMAINING_SERVICES" -gt 0 ] || [ "$REMAINING_INGRESS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some resources are still present:${NC}"
    echo "   Pods: $REMAINING_PODS"
    echo "   Services: $REMAINING_SERVICES" 
    echo "   Ingress: $REMAINING_INGRESS"
    
    confirm "Do you want to force delete remaining resources?"
    
    # Force delete remaining pods
    if [ "$REMAINING_PODS" -gt 0 ]; then
        echo -e "${BLUE}🗑️  Force deleting remaining pods...${NC}"
        microk8s.kubectl delete pods -n ${NAMESPACE} -l app.kubernetes.io/name=plaggona-k8s --force --grace-period=0
    fi
    
    # Delete remaining services
    if [ "$REMAINING_SERVICES" -gt 0 ]; then
        echo -e "${BLUE}🗑️  Deleting remaining services...${NC}"
        microk8s.kubectl delete svc -n ${NAMESPACE} -l app.kubernetes.io/name=plaggona-k8s
    fi
    
    # Delete remaining ingress
    if [ "$REMAINING_INGRESS" -gt 0 ]; then
        echo -e "${BLUE}🗑️  Deleting remaining ingress...${NC}"
        microk8s.kubectl delete ingress -n ${NAMESPACE} -l app.kubernetes.io/name=plaggona-k8s
    fi
fi

# Check for custom websocket middleware
echo -e "${BLUE}🔍 Checking for websocket middleware...${NC}"
if microk8s.kubectl get middleware websocket -n ${NAMESPACE} 2>/dev/null; then
    confirm "WebSocket middleware found. Do you want to delete it?"
    microk8s.kubectl delete middleware websocket -n ${NAMESPACE}
    echo -e "${GREEN}✅ WebSocket middleware deleted.${NC}"
fi

# Option to remove Docker images
echo -e "${BLUE}🐳 Docker Image Management:${NC}"
if docker images | grep -q "${IMAGE_REGISTRY}/${IMAGE_NAME}"; then
    echo "Found Docker images:"
    docker images | grep "${IMAGE_REGISTRY}/${IMAGE_NAME}"
    echo ""
    confirm "Do you want to remove Docker images from local registry?"
    
    # Remove local Docker images
    echo -e "${BLUE}🗑️  Removing Docker images...${NC}"
    docker images --format "table {{.Repository}}:{{.Tag}}" | grep "${IMAGE_REGISTRY}/${IMAGE_NAME}" | while read image; do
        echo "Removing image: $image"
        docker rmi "$image" 2>/dev/null || echo "Failed to remove $image"
    done
    
    # Clean up dangling images
    echo -e "${BLUE}🧹 Cleaning up dangling images...${NC}"
    docker image prune -f
    
    echo -e "${GREEN}✅ Docker images cleaned up.${NC}"
else
    echo -e "${YELLOW}⚠️  No Docker images found for ${IMAGE_REGISTRY}/${IMAGE_NAME}${NC}"
fi

# Option to remove Helm chart package
if [ -f "./charts/plaggona-k8s/plaggona-k8s-0.1.0.tgz" ]; then
    confirm "Do you want to remove the Helm chart package?"
    rm -f ./charts/plaggona-k8s/plaggona-k8s-0.1.0.tgz
    echo -e "${GREEN}✅ Helm chart package removed.${NC}"
fi

# Final verification
echo -e "${BLUE}🔍 Final verification...${NC}"
echo ""
echo -e "${BLUE}📊 Final Status:${NC}"
echo "Helm releases:"
microk8s.helm3 list -n ${NAMESPACE}
echo ""
echo "Pods (should be empty):"
microk8s.kubectl get pods -n ${NAMESPACE} -l app.kubernetes.io/name=plaggona-k8s 2>/dev/null || echo "No pods found ✅"
echo ""
echo "Services (should be empty):"
microk8s.kubectl get svc -n ${NAMESPACE} -l app.kubernetes.io/name=plaggona-k8s 2>/dev/null || echo "No services found ✅"
echo ""
echo "Ingress (should be empty):"
microk8s.kubectl get ingress -n ${NAMESPACE} -l app.kubernetes.io/name=plaggona-k8s 2>/dev/null || echo "No ingress found ✅"
echo ""

# Summary
echo -e "${GREEN}✅ Uninstall completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "   • Helm release '${RELEASE_NAME}' removed from namespace '${NAMESPACE}'"
echo "   • All Kubernetes resources cleaned up"
echo "   • WebSocket middleware removed (if present)"
echo "   • Docker images cleaned up (if requested)"
echo "   • Helm chart package removed (if requested)"
echo ""
echo -e "${BLUE}🔧 To redeploy the Plaggona Metaverse:${NC}"
echo "   ./deploy.sh"
echo ""
echo -e "${GREEN}🌍 Plaggona Metaverse has been successfully uninstalled! 👋${NC}"

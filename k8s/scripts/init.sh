#!/bin/bash

set -e  # stop on first error

echo "Starting Minikube..."
minikube start

echo "Setting Docker environment for Minikube..."
eval $(minikube -p minikube docker-env)

# Navigate to repo root
cd "$(dirname "$0")/../.."

# Build all images
echo "Building user-service..."
docker build -t user-service:latest ./user-service

echo "Building order-service..."
docker build -t order-service:latest ./order-service

# Verify images are in Minikube
echo "Verifying images..."
docker images | grep service
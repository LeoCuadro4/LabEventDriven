#!/bin/bash

set -e  # stop on first error

echo "Starting Minikube..."
minikube start

echo "Setting Docker environment for Minikube..."
eval $(minikube -p minikube docker-env)

# Build all images
docker build -t user-service:latest ../../user-service
docker build -t product-service:latest ../../product-service
docker build -t shipping-service:latest ../../shipping-service
docker build -t analytics-service:latest ../../analytics-service


# Verify images are in Minikube
docker images | grep service
docker images | grep product-service
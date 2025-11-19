#!/bin/bash

set -e

# Navigate to script directory
cd "$(dirname "$0")"

echo "--- Creating Namespace ---"
kubectl apply -f ../services/namespace.yml

echo "--- Deploying Zookeeper ---"
kubectl apply -f ../services/zookeeper.yml
echo "Waiting for Zookeeper pod to be created..."
sleep 5
kubectl wait --for=condition=ready pod -l app=zookeeper -n microservices --timeout=120s

echo "--- Deploying Kafka ---"
kubectl apply -f ../services/kafka.yml
echo "Waiting for Kafka pod to be created..."
sleep 5
kubectl wait --for=condition=ready pod -l app=kafka -n microservices --timeout=180s

echo "--- Deploying User Service ---"
kubectl apply -f ../services/user-service.yml
echo "Waiting for User Service pod to be created..."
sleep 5
kubectl wait --for=condition=ready pod -l app=user-service -n microservices --timeout=180s

echo "--- Deploying Order Service ---"
kubectl apply -f ../services/order-service.yml
echo "Waiting for Order Service pod to be created..."
sleep 5
kubectl wait --for=condition=ready pod -l app=order-service -n microservices --timeout=180s

echo "--- All Resources ---"
kubectl get all -n microservices

echo "--- Port Forwarding ---"
 
kubectl port-forward -n microservices svc/user-service 3001:3001 &
kubectl port-forward -n microservices svc/order-service 3004:3004 &

echo "Deployment complete. Services accessible at:"
echo "  - User Service: localhost:3001"
echo "  - Order Service: localhost:3004"
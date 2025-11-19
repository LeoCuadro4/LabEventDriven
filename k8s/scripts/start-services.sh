#!/bin/bash

set -e

echo "--- Creating Namespace ---"
kubectl apply -f ../services/namespace.yml

echo "--- Deploying Zookeeper ---"
kubectl apply -f ../services/zookeeper.yml
kubectl wait --for=condition=ready pod -l app=zookeeper -n microservices --timeout=120s

echo "--- Deploying Kafka ---"
kubectl apply -f ../services/kafka.yml
kubectl wait --for=condition=ready pod -l app=kafka -n microservices --timeout=180s

echo "--- Deploying User Service ---"
kubectl apply -f ../services/user-service.yml

echo "--- Waiting for User Service ---"
# FIX: Do not use 'pod --all'. Target the specific app label instead.
kubectl wait --for=condition=ready pod -l app=user-service -n microservices --timeout=180s

echo "--- Deploying Product Service ---"
kubectl apply -f ../services/product-service.yml

echo "--- Waiting for Product Service ---"
# FIX: Do not use 'pod --all'. Target the specific app label instead.
kubectl wait --for=condition=ready pod -l app=product-service -n microservices --timeout=180s


echo "--- Deploying Inventory Service ---"
kubectl apply -f ../services/inventory-service.yml

echo "--- Waiting for Inventory Service ---"
kubectl wait --for=condition=ready pod -l app=inventory-service -n microservices --timeout=180s

echo "--- Deploying Shipping Service ---"
kubectl apply -f ../services/shipping-service.yml

echo "--- Waiting for Shipping Service ---"
# FIX: Do not use 'pod --all'. Target the specific app label instead.
kubectl wait --for=condition=ready pod -l app=shipping-service -n microservices --timeout=180s

echo "--- All Resources ---"
kubectl get all -n microservices

echo "--- Port Forwarding ---"
 
kubectl port-forward -n microservices svc/user-service 3001:3001 &
kubectl port-forward -n microservices svc/product-service 3002:3002 &
kubectl port-forward -n microservices svc/inventory-service 3005:3005 &
kubectl port-forward -n microservices svc/shipping-service 3006:3006 &

echo "Deployment complete. User Service accessible at localhost:3001"
echo "Product Service accessible at localhost:3002"
echo "Inventory Service accessible at localhost:3005"
echo "Shipping Service accessible at localhost:3006"
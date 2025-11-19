## K8s/scripts

### delete-images
```
docker rmi shipping-service:latest
```

### init
```
docker build -t shipping-service:latest ../../shipping-service
```

### start-services
```
echo "--- Deploying Shipping Service ---"
kubectl apply -f ../services/shipping-service.yml

echo "--- Waiting for Shipping Service ---"
# FIX: Do not use 'pod --all'. Target the specific app label instead.
kubectl wait --for=condition=ready pod -l app=shipping-service -n microservices --timeout=180s

kubectl port-forward -n microservices svc/shipping-service 3006:3006 &
echo "Deployment complete. Shipping Service accessible at localhost:3006"
```

## docker-compose

### services
```
shipping-service:
    build:
      context: ./shipping-service
      dockerfile: Dockerfile
    container_name: shipping-service
    ports:
      - "3006:3006"
    environment:
      - KAFKA_BROKER=kafka:29092
      - SERVICE_NAME=shipping-service
    networks:
      - microservices-net
    depends_on:
      # kafka-init:  
      #   condition: service_completed_successfully
      kafka:                                    
        condition: service_healthy
```

### services/kafka-init
```
# Create topics with proper configuration
#kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists --topic shipping-events --partitions 3 --replication-factor 1
```
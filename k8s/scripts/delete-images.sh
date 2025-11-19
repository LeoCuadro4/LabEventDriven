#!/bin/bash

# Delete by name and tag
docker rmi -f user-service:latest || true
docker rmi -f order-service:latest || true
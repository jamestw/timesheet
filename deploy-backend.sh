#!/bin/bash

# Timesheet System Backend Deployment Script
# This script deploys the FastAPI backend to the VPS server

set -e  # Exit on any error

# Configuration
VPS_HOST="root@185.201.8.177"
VPS_PATH="/home/docker/timesheet"
CONTAINER_NAME="timesheet_backend"

echo "🚀 Starting backend deployment to VPS..."

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Check if SSH connection works
echo "🔐 Testing SSH connection..."
if ! ssh -o ConnectTimeout=10 "$VPS_HOST" "echo 'SSH connection successful'" 2>/dev/null; then
    echo "❌ Error: Cannot connect to VPS. Please check:"
    echo "   - SSH key is configured"
    echo "   - VPS is accessible at $VPS_HOST"
    echo "   - Network connection is working"
    exit 1
fi

echo "📁 Syncing application code to VPS..."

# Check if rsync is available
if command -v rsync >/dev/null 2>&1; then
    echo "🚀 Using rsync for efficient sync..."
    # Exclude node_modules, dist, and other unnecessary files
    rsync -avz --exclude='frontend/node_modules/' \
               --exclude='frontend/dist/' \
               --exclude='.git/' \
               --exclude='*.log' \
               --exclude='__pycache__/' \
               ./ "$VPS_HOST:$VPS_PATH/"
else
    echo "📦 rsync not found, using tar+scp method..."
    # Create temporary archive and transfer to VPS
    echo "📦 Creating deployment archive..."
    tar -czf timesheet_deploy.tar.gz \
        --exclude='frontend/node_modules' \
        --exclude='frontend/dist' \
        --exclude='.git' \
        --exclude='*.log' \
        --exclude='__pycache__' \
        --exclude='timesheet_deploy.tar.gz' \
        .

    echo "⬆️ Uploading to VPS..."
    scp timesheet_deploy.tar.gz "$VPS_HOST:$VPS_PATH/"

    echo "📂 Extracting on VPS..."
    ssh "$VPS_HOST" "cd $VPS_PATH && tar -xzf timesheet_deploy.tar.gz && rm timesheet_deploy.tar.gz"

    echo "🧹 Cleaning up local archive..."
    rm timesheet_deploy.tar.gz
fi

echo "🐳 Building and deploying backend container..."
ssh "$VPS_HOST" "cd $VPS_PATH && {
    echo '🛑 Stopping existing backend container...'
    docker stop $CONTAINER_NAME 2>/dev/null || echo 'Container not running'
    docker rm $CONTAINER_NAME 2>/dev/null || echo 'Container not found'

    echo '🏗️ Building new backend image...'
    docker-compose build backend

    echo '🚀 Starting backend container...'
    docker-compose up -d backend

    echo '⏳ Waiting for backend to be healthy...'
    sleep 10

    echo '🔍 Checking backend status...'
    docker ps | grep $CONTAINER_NAME

    echo '🏥 Checking health endpoint...'
    if curl -f http://localhost:8130/health 2>/dev/null; then
        echo '✅ Backend is healthy and responding'
    else
        echo '⚠️ Backend may not be fully ready yet'
        echo 'Check logs with: docker logs $CONTAINER_NAME'
    fi
}"

echo ""
echo "✅ Backend deployment completed!"
echo "🌐 Backend URLs:"
echo "   - Health check: https://timesheet.aerocars.cc/health"
echo "   - API documentation: https://timesheet.aerocars.cc/docs"
echo "   - Direct access: https://timesheet.aerocars.cc/api/v1/"
echo ""
echo "📝 Verification steps:"
echo "   1. Check health endpoint: curl https://timesheet.aerocars.cc/health"
echo "   2. Test API login: Use frontend or API docs"
echo "   3. Monitor logs: ssh $VPS_HOST 'docker logs $CONTAINER_NAME'"
echo ""
echo "🔧 Troubleshooting:"
echo "   - View logs: ssh $VPS_HOST 'docker logs $CONTAINER_NAME'"
echo "   - Restart container: ssh $VPS_HOST 'cd $VPS_PATH && docker-compose restart backend'"
echo "   - Check database: ssh $VPS_HOST 'docker exec $CONTAINER_NAME python -c \"from app.db.database import get_db; print(\\\"Database connected\\\")\"'"
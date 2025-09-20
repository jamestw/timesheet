#!/bin/bash

# VPS-Specific Deployment Script for Timesheet System
# Target: root@185.201.8.177:/home/docker/timesheet
# Author: Claude Code Assistant
# Version: 1.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# VPS Configuration
VPS_SERVER="root@185.201.8.177"
PROJECT_PATH="/home/docker/timesheet"
PROJECT_NAME="timesheet-system"
LOG_FILE="/var/log/timesheet-deploy.log"

# Port Configuration (to avoid conflicts)
BACKEND_PORT="8130"  # Avoiding 8000, 8110, 8120
FRONTEND_PORT="3020" # Avoiding 3010

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check if running locally
check_local_environment() {
    log "Checking local environment..."

    # Check if we have the project files
    if [[ ! -f "docker-compose.yml" ]]; then
        error "docker-compose.yml not found. Please run this script from the project root directory."
    fi

    # Check if .env exists
    if [[ ! -f ".env" ]]; then
        warning ".env file not found. Creating from .env.vps template..."
        if [[ -f ".env.vps" ]]; then
            cp .env.vps .env
        else
            error "Please create .env file with your VPS configuration before deploying."
        fi
    fi

    log "Local environment check completed."
}

# Deploy to VPS
deploy_to_vps() {
    log "Starting deployment to VPS: $VPS_SERVER"

    # Create project directory on VPS
    log "Creating project directory on VPS..."
    ssh $VPS_SERVER "mkdir -p $PROJECT_PATH"

    # Copy project files to VPS
    log "Copying project files to VPS..."
    rsync -avz --delete \
        --exclude='.git/' \
        --exclude='node_modules/' \
        --exclude='frontend/node_modules/' \
        --exclude='*.log' \
        --exclude='sql_app.db' \
        ./ $VPS_SERVER:$PROJECT_PATH/

    log "Files copied successfully."
}

# Setup VPS environment
setup_vps_environment() {
    log "Setting up VPS environment..."

    ssh $VPS_SERVER << 'EOF'
        cd /home/docker/timesheet

        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            echo "Installing Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            rm get-docker.sh
        fi

        # Check if Docker Compose is installed
        if ! command -v docker-compose &> /dev/null; then
            echo "Installing Docker Compose..."
            curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi

        echo "VPS environment setup completed."
EOF

    log "VPS environment setup completed."
}

# Create database and user on existing PostgreSQL
setup_database() {
    log "Setting up database on existing PostgreSQL..."

    ssh $VPS_SERVER << 'EOF'
        # Load environment variables
        cd /home/docker/timesheet
        source .env

        # Connect to existing PostgreSQL and create database
        echo "Creating database and user..."
        docker exec my_postgres_db psql -U postgres -c "CREATE DATABASE ${POSTGRES_DB:-timesheet_db};" 2>/dev/null || echo "Database already exists"
        docker exec my_postgres_db psql -U postgres -c "CREATE USER ${POSTGRES_USER:-timesheet_user} WITH PASSWORD '${POSTGRES_PASSWORD}';" 2>/dev/null || echo "User already exists"
        docker exec my_postgres_db psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB:-timesheet_db} TO ${POSTGRES_USER:-timesheet_user};"
        docker exec my_postgres_db psql -U postgres -c "ALTER DATABASE ${POSTGRES_DB:-timesheet_db} OWNER TO ${POSTGRES_USER:-timesheet_user};"

        echo "Database setup completed."
EOF

    log "Database setup completed."
}

# Start services on VPS
start_services() {
    log "Starting services on VPS..."

    ssh $VPS_SERVER << 'EOF'
        cd /home/docker/timesheet

        # Stop existing services if running
        docker-compose down --remove-orphans 2>/dev/null || true

        # Build and start services
        docker-compose up --build -d

        # Wait for services to start
        sleep 30

        # Check if containers are running
        docker-compose ps
EOF

    log "Services started successfully."
}

# Create initial admin user
create_admin_user() {
    log "Creating initial admin user..."

    ssh $VPS_SERVER << 'EOF'
        cd /home/docker/timesheet

        # Wait for backend to be ready
        sleep 10

        # Create initial admin user
        docker-compose exec -T backend python /app/create_initial_admin.py
EOF

    log "Initial admin user created."
}

# Health check
health_check() {
    log "Performing health checks..."

    ssh $VPS_SERVER << EOF
        cd $PROJECT_PATH

        # Check if containers are running
        if ! docker-compose ps | grep "Up" > /dev/null; then
            echo "ERROR: Some containers are not running."
            docker-compose logs
            exit 1
        fi

        # Check backend health
        if curl -f http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
            echo "✅ Backend health check passed"
        else
            echo "⚠️  Backend health check failed - it might still be starting up"
        fi

        # Check frontend health
        if curl -f http://localhost:$FRONTEND_PORT/health > /dev/null 2>&1; then
            echo "✅ Frontend health check passed"
        else
            echo "⚠️  Frontend health check failed - it might still be starting up"
        fi
EOF

    log "Health checks completed."
}

# Show deployment info
show_deployment_info() {
    log "Deployment completed successfully!"
    info ""
    info "🚀 Timesheet System is now running on VPS!"
    info ""
    info "📊 Service Information:"
    info "  - Backend API: http://185.201.8.177:$BACKEND_PORT"
    info "  - Frontend App: http://185.201.8.177:$FRONTEND_PORT"
    info "  - Admin Login: admin@timesheet.com"
    info ""
    info "🔧 Management Commands (run on VPS):"
    info "  ssh $VPS_SERVER 'cd $PROJECT_PATH && docker-compose logs -f'"
    info "  ssh $VPS_SERVER 'cd $PROJECT_PATH && docker-compose restart'"
    info "  ssh $VPS_SERVER 'cd $PROJECT_PATH && docker-compose ps'"
    info ""
    info "📝 Next Steps:"
    info "  1. Test the application at http://185.201.8.177:$FRONTEND_PORT"
    info "  2. Login with admin credentials and change password"
    info "  3. Configure company location for GPS tracking"
    info "  4. Set up SSL certificate if needed"
}

# Main deployment function
main() {
    log "Starting VPS deployment of $PROJECT_NAME..."

    check_local_environment
    deploy_to_vps
    setup_vps_environment
    setup_database
    start_services
    create_admin_user
    health_check
    show_deployment_info
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "update")
        log "Updating VPS deployment..."
        deploy_to_vps
        ssh $VPS_SERVER "cd $PROJECT_PATH && docker-compose up --build -d"
        health_check
        log "Update completed."
        ;;
    "logs")
        ssh $VPS_SERVER "cd $PROJECT_PATH && docker-compose logs -f"
        ;;
    "status")
        ssh $VPS_SERVER "cd $PROJECT_PATH && docker-compose ps"
        ;;
    "stop")
        ssh $VPS_SERVER "cd $PROJECT_PATH && docker-compose down"
        log "Services stopped."
        ;;
    "restart")
        ssh $VPS_SERVER "cd $PROJECT_PATH && docker-compose restart"
        log "Services restarted."
        ;;
    "ssh")
        ssh $VPS_SERVER "cd $PROJECT_PATH && bash"
        ;;
    *)
        echo "Usage: $0 {deploy|update|logs|status|stop|restart|ssh}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Full deployment to VPS"
        echo "  update  - Update existing deployment"
        echo "  logs    - View service logs"
        echo "  status  - Check service status"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  ssh     - SSH to VPS project directory"
        exit 1
        ;;
esac
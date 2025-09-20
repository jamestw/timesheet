#!/bin/bash

# Timesheet System Complete Deployment Script
# This script deploys both frontend and backend components
# Author: Claude Code Assistant
# Version: 2.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_HOST="root@185.201.8.177"
VPS_PATH="/home/docker/timesheet"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi

    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi

    # Check if .env file exists
    if [[ ! -f ".env" ]]; then
        warning ".env file not found. Creating from .env.prod template..."
        cp .env.prod .env
        error "Please edit .env file with your actual configuration values before running deploy again."
    fi

    log "Prerequisites check completed."
}

# Create directories
create_directories() {
    log "Creating necessary directories..."

    sudo mkdir -p "$DEPLOY_PATH"
    sudo mkdir -p "$BACKUP_PATH"
    sudo mkdir -p "/var/log/nginx"
    sudo mkdir -p "/etc/nginx/ssl"

    # Set permissions
    sudo chown -R $USER:$USER "$DEPLOY_PATH"

    log "Directories created successfully."
}

# Backup existing deployment
backup_existing() {
    if [[ -d "$DEPLOY_PATH/current" ]]; then
        log "Creating backup of existing deployment..."

        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
        sudo cp -r "$DEPLOY_PATH/current" "$BACKUP_PATH/$BACKUP_NAME"

        log "Backup created: $BACKUP_PATH/$BACKUP_NAME"
    fi
}

# Deploy application
deploy_application() {
    log "Deploying application..."

    # Create current deployment directory
    sudo mkdir -p "$DEPLOY_PATH/current"
    sudo chown -R $USER:$USER "$DEPLOY_PATH/current"

    # Copy application files
    cp -r . "$DEPLOY_PATH/current/"

    # Navigate to deployment directory
    cd "$DEPLOY_PATH/current"

    log "Application files copied successfully."
}

# Setup SSL certificates (Let's Encrypt)
setup_ssl() {
    log "Setting up SSL certificates..."

    # Load environment variables
    source .env

    if [[ -z "$DOMAIN" || -z "$SSL_EMAIL" ]]; then
        warning "DOMAIN or SSL_EMAIL not set in .env. Skipping SSL setup."
        warning "You can set up SSL manually later using certbot."
        return
    fi

    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        log "Installing certbot..."
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    fi

    # Generate SSL certificate
    log "Generating SSL certificate for $DOMAIN..."
    sudo certbot certonly --standalone \
        --email "$SSL_EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        --non-interactive

    # Copy certificates to nginx directory
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "/etc/nginx/ssl/"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "/etc/nginx/ssl/"

    log "SSL certificates configured successfully."
}

# Start services
start_services() {
    log "Starting services..."

    # Stop existing services
    docker-compose down --remove-orphans 2>/dev/null || true

    # Build and start services
    docker-compose up --build -d

    log "Services started successfully."
}

# Health check
health_check() {
    log "Performing health checks..."

    # Wait for services to start
    sleep 30

    # Check if containers are running
    if ! docker-compose ps | grep "Up" > /dev/null; then
        error "Some containers are not running. Check docker-compose logs for details."
    fi

    # Check backend health
    if ! curl -f http://localhost:8001/health > /dev/null 2>&1; then
        warning "Backend health check failed. It might still be starting up."
    fi

    # Check frontend health
    if ! curl -f http://localhost/health > /dev/null 2>&1; then
        warning "Frontend health check failed. It might still be starting up."
    fi

    log "Health checks completed."
}

# Setup firewall
setup_firewall() {
    log "Configuring firewall..."

    # Enable UFW if not already enabled
    sudo ufw --force enable

    # Allow SSH (important!)
    sudo ufw allow ssh

    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp

    # Deny all other incoming by default
    sudo ufw default deny incoming
    sudo ufw default allow outgoing

    log "Firewall configured successfully."
}

# Setup logrotate
setup_logrotate() {
    log "Setting up log rotation..."

    sudo tee /etc/logrotate.d/timesheet-system > /dev/null <<EOF
/var/log/timesheet-deploy.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}

/var/log/nginx/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 nginx nginx
    postrotate
        docker-compose exec nginx nginx -s reload
    endscript
}
EOF

    log "Log rotation configured successfully."
}

# Main deployment function
main() {
    log "Starting deployment of $PROJECT_NAME..."

    check_root
    check_prerequisites
    create_directories
    backup_existing
    deploy_application
    setup_ssl
    start_services
    health_check
    setup_firewall
    setup_logrotate

    log "Deployment completed successfully!"
    info "Your timesheet system is now running."
    info "Access it at: https://$(grep DOMAIN .env | cut -d= -f2)"
    info ""
    info "Useful commands:"
    info "  - View logs: docker-compose logs -f"
    info "  - Restart services: docker-compose restart"
    info "  - Stop services: docker-compose down"
    info "  - View container status: docker-compose ps"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "update")
        log "Updating deployment..."
        cd "$DEPLOY_PATH/current"
        git pull origin main
        docker-compose up --build -d
        health_check
        log "Update completed."
        ;;
    "backup")
        backup_existing
        ;;
    "logs")
        cd "$DEPLOY_PATH/current"
        docker-compose logs -f
        ;;
    "status")
        cd "$DEPLOY_PATH/current"
        docker-compose ps
        ;;
    "stop")
        cd "$DEPLOY_PATH/current"
        docker-compose down
        log "Services stopped."
        ;;
    "restart")
        cd "$DEPLOY_PATH/current"
        docker-compose restart
        log "Services restarted."
        ;;
    *)
        echo "Usage: $0 {deploy|update|backup|logs|status|stop|restart}"
        exit 1
        ;;
esac
#!/bin/bash

# Domain-Specific Deployment Script for timesheet.aerocars.cc
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

# Configuration
VPS_SERVER="root@185.201.8.177"
PROJECT_PATH="/home/docker/timesheet"
DOMAIN="timesheet.aerocars.cc"
PROJECT_NAME="timesheet-system"
LOG_FILE="/var/log/timesheet-deploy.log"

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

# Check local environment
check_local_environment() {
    log "Checking local environment..."

    if [[ ! -f "docker-compose.yml" ]]; then
        error "docker-compose.yml not found. Please run this script from the project root directory."
    fi

    # For initial deployment, we'll create .env on the VPS
    # No need to check .env locally for first-time deployment

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

    # Check if rsync is available, otherwise use scp
    if command -v rsync &> /dev/null; then
        rsync -avz --delete \
            --exclude='.git/' \
            --exclude='node_modules/' \
            --exclude='frontend/node_modules/' \
            --exclude='*.log' \
            --exclude='sql_app.db' \
            ./ $VPS_SERVER:$PROJECT_PATH/
    else
        log "rsync not found, using scp method..."

        # Create a temporary archive
        TEMP_FILE="timesheet-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"

        tar czf "$TEMP_FILE" \
            --exclude='.git' \
            --exclude='node_modules' \
            --exclude='frontend/node_modules' \
            --exclude='*.log' \
            --exclude='sql_app.db' \
            .

        # Copy and extract on VPS
        scp "$TEMP_FILE" $VPS_SERVER:$PROJECT_PATH/
        ssh $VPS_SERVER "cd $PROJECT_PATH && tar xzf $TEMP_FILE && rm $TEMP_FILE"

        # Clean up local temp file
        rm "$TEMP_FILE"
    fi

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

# Setup environment and database
setup_environment_and_database() {
    log "Setting up environment and database on VPS..."

    ssh $VPS_SERVER << 'EOF'
        cd /home/docker/timesheet

        # Create .env from template if it doesn't exist
        if [[ ! -f ".env" ]]; then
            echo "Creating .env from .env.vps template..."
            cp .env.vps .env

            # You can customize these values here or edit .env manually later
            echo ""
            echo "📝 Please review and edit .env file with your configuration:"
            echo "  - POSTGRES_PASSWORD=your_secure_password"
            echo "  - SECRET_KEY=your_very_secure_secret_key"
            echo "  - SSL_EMAIL=your-email@example.com"
            echo "  - ADMIN_PASSWORD=your_admin_password"
            echo ""
            echo "Current .env content:"
            cat .env
            echo ""
            read -p "Press Enter to continue with current settings, or Ctrl+C to exit and edit manually..."
        fi

        # Load environment variables
        source .env

        # Create database and user
        echo "Creating database and user..."
        docker exec my_postgres_db psql -U postgres -c "CREATE DATABASE ${POSTGRES_DB:-timesheet_db};" 2>/dev/null || echo "Database already exists"
        docker exec my_postgres_db psql -U postgres -c "CREATE USER ${POSTGRES_USER:-timesheet_user} WITH PASSWORD '${POSTGRES_PASSWORD}';" 2>/dev/null || echo "User already exists"
        docker exec my_postgres_db psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB:-timesheet_db} TO ${POSTGRES_USER:-timesheet_user};"
        docker exec my_postgres_db psql -U postgres -c "ALTER DATABASE ${POSTGRES_DB:-timesheet_db} OWNER TO ${POSTGRES_USER:-timesheet_user};"

        echo "Environment and database setup completed."
EOF

    log "Environment and database setup completed."
}

# Setup SSL certificate
setup_ssl() {
    log "Setting up SSL certificate for $DOMAIN..."

    ssh $VPS_SERVER << EOF
        cd $PROJECT_PATH

        # Create directories for certbot
        mkdir -p certbot/www
        mkdir -p nginx/ssl

        # Load environment variables
        source .env

        # Start nginx temporarily for certificate validation
        docker-compose up -d nginx

        # Wait for nginx to start
        sleep 10

        # Request SSL certificate
        docker-compose run --rm certbot certonly \\
            --webroot \\
            --webroot-path=/var/www/certbot \\
            --email \${SSL_EMAIL} \\
            --agree-tos \\
            --no-eff-email \\
            -d $DOMAIN

        # Restart nginx with SSL
        docker-compose restart nginx

        echo "SSL certificate setup completed."
EOF

    log "SSL certificate setup completed."
}

# Start services
start_services() {
    log "Starting services on VPS..."

    ssh $VPS_SERVER << 'EOF'
        cd /home/docker/timesheet

        # Stop existing services
        docker-compose down --remove-orphans 2>/dev/null || true

        # Build and start services
        docker-compose up --build -d

        # Wait for services to start
        sleep 30

        # Check container status
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
        sleep 15

        # Create initial admin user
        docker-compose exec -T backend python /app/create_initial_admin.py || echo "Admin user might already exist"
EOF

    log "Initial admin user setup completed."
}

# Health check
health_check() {
    log "Performing health checks..."

    ssh $VPS_SERVER << EOF
        cd $PROJECT_PATH

        # Check containers
        if ! docker-compose ps | grep "Up" > /dev/null; then
            echo "ERROR: Some containers are not running."
            docker-compose logs --tail=50
            exit 1
        fi

        # Check domain SSL
        if curl -f https://$DOMAIN/health > /dev/null 2>&1; then
            echo "✅ HTTPS health check passed"
        else
            echo "⚠️  HTTPS health check failed - checking HTTP..."
            if curl -f http://$DOMAIN/health > /dev/null 2>&1; then
                echo "✅ HTTP health check passed"
            else
                echo "⚠️  Health check failed - services might still be starting"
            fi
        fi

        # Check API
        if curl -f https://$DOMAIN/api/health > /dev/null 2>&1; then
            echo "✅ API health check passed"
        else
            echo "⚠️  API health check failed"
        fi
EOF

    log "Health checks completed."
}

# Setup SSL certificate renewal
setup_ssl_renewal() {
    log "Setting up SSL certificate auto-renewal..."

    ssh $VPS_SERVER << 'EOF'
        # Create renewal script
        cat > /usr/local/bin/renew-timesheet-ssl.sh << 'SCRIPT'
#!/bin/bash
cd /home/docker/timesheet
docker-compose run --rm certbot renew
docker-compose restart nginx
SCRIPT

        chmod +x /usr/local/bin/renew-timesheet-ssl.sh

        # Add to crontab (run monthly)
        (crontab -l 2>/dev/null; echo "0 3 1 * * /usr/local/bin/renew-timesheet-ssl.sh >> /var/log/ssl-renewal.log 2>&1") | crontab -

        echo "SSL auto-renewal setup completed."
EOF

    log "SSL auto-renewal setup completed."
}

# Show deployment info
show_deployment_info() {
    log "Deployment completed successfully!"
    info ""
    info "🚀 Timesheet System is now running with HTTPS!"
    info ""
    info "🌐 Access URLs:"
    info "  - Main Application: https://$DOMAIN"
    info "  - API Documentation: https://$DOMAIN/api/docs"
    info "  - Health Check: https://$DOMAIN/health"
    info ""
    info "🔑 Login Credentials:"
    info "  - Email: admin@timesheet.com"
    info "  - Password: (check your .env ADMIN_PASSWORD)"
    info ""
    info "🔧 Management Commands:"
    info "  ./deploy-domain.sh logs    - View logs"
    info "  ./deploy-domain.sh status  - Check status"
    info "  ./deploy-domain.sh restart - Restart services"
    info "  ./deploy-domain.sh ssl     - Renew SSL certificate"
    info ""
    info "📝 Next Steps:"
    info "  1. Test the application at https://$DOMAIN"
    info "  2. Login and change admin password"
    info "  3. Configure company location for GPS tracking"
    info "  4. Set up users and departments"
}

# Main deployment function
main() {
    log "Starting domain deployment of $PROJECT_NAME to https://$DOMAIN..."

    check_local_environment
    deploy_to_vps
    setup_vps_environment
    setup_environment_and_database
    start_services
    setup_ssl
    create_admin_user
    health_check
    setup_ssl_renewal
    show_deployment_info
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "update")
        log "Updating deployment..."
        deploy_to_vps
        ssh $VPS_SERVER "cd $PROJECT_PATH && docker-compose up --build -d"
        health_check
        log "Update completed."
        ;;
    "ssl")
        log "Renewing SSL certificate..."
        ssh $VPS_SERVER "cd $PROJECT_PATH && docker-compose run --rm certbot renew && docker-compose restart nginx"
        log "SSL renewal completed."
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
        echo "Usage: $0 {deploy|update|ssl|logs|status|stop|restart|ssh}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Full deployment with SSL"
        echo "  update  - Update existing deployment"
        echo "  ssl     - Renew SSL certificate"
        echo "  logs    - View service logs"
        echo "  status  - Check service status"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  ssh     - SSH to VPS project directory"
        exit 1
        ;;
esac
#!/bin/bash

# Timesheet System Complete Deployment Script
# This script deploys both frontend and backend components

set -e  # Exit on any error

echo "🚀 Timesheet System - Complete Deployment"
echo "=========================================="

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory."
    exit 1
fi

# Function to ask user for confirmation
confirm() {
    read -p "$1 (y/N): " response
    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Parse command line arguments
DEPLOY_FRONTEND=false
DEPLOY_BACKEND=false
DEPLOY_ALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend)
            DEPLOY_FRONTEND=true
            shift
            ;;
        --backend)
            DEPLOY_BACKEND=true
            shift
            ;;
        --all)
            DEPLOY_ALL=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--frontend] [--backend] [--all]"
            echo ""
            echo "Options:"
            echo "  --frontend    Deploy only frontend to Firebase"
            echo "  --backend     Deploy only backend to VPS"
            echo "  --all         Deploy both frontend and backend"
            echo "  -h, --help    Show this help message"
            echo ""
            echo "If no options are provided, you'll be prompted to choose."
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information."
            exit 1
            ;;
    esac
done

# If no specific deployment option, ask user
if [ "$DEPLOY_ALL" = false ] && [ "$DEPLOY_FRONTEND" = false ] && [ "$DEPLOY_BACKEND" = false ]; then
    echo "What would you like to deploy?"
    echo "1. Frontend only (Firebase)"
    echo "2. Backend only (VPS)"
    echo "3. Both frontend and backend"
    echo ""
    read -p "Enter your choice (1-3): " choice

    case $choice in
        1)
            DEPLOY_FRONTEND=true
            ;;
        2)
            DEPLOY_BACKEND=true
            ;;
        3)
            DEPLOY_ALL=true
            ;;
        *)
            echo "❌ Invalid choice. Exiting."
            exit 1
            ;;
    esac
fi

# Set deployment flags for --all option
if [ "$DEPLOY_ALL" = true ]; then
    DEPLOY_FRONTEND=true
    DEPLOY_BACKEND=true
fi

echo ""
echo "📋 Deployment Plan:"
[ "$DEPLOY_FRONTEND" = true ] && echo "  ✓ Frontend (Firebase)"
[ "$DEPLOY_BACKEND" = true ] && echo "  ✓ Backend (VPS)"
echo ""

if ! confirm "Continue with deployment?"; then
    echo "❌ Deployment cancelled."
    exit 0
fi

# Deploy Frontend
if [ "$DEPLOY_FRONTEND" = true ]; then
    echo ""
    echo "🎨 Deploying Frontend..."
    echo "========================"

    if [ -f "frontend/deploy.sh" ]; then
        cd frontend
        chmod +x deploy.sh
        ./deploy.sh
        cd ..
    else
        echo "❌ Error: frontend/deploy.sh not found"
        exit 1
    fi
fi

# Deploy Backend
if [ "$DEPLOY_BACKEND" = true ]; then
    echo ""
    echo "⚙️  Deploying Backend..."
    echo "======================="

    if [ -f "deploy-backend.sh" ]; then
        chmod +x deploy-backend.sh
        ./deploy-backend.sh
    else
        echo "❌ Error: deploy-backend.sh not found"
        exit 1
    fi
fi

echo ""
echo "🎉 Deployment Completed Successfully!"
echo "====================================="
echo ""
echo "📱 Application URLs:"
echo "   Frontend: https://timesheet-5fff2.web.app"
echo "   Backend API: https://timesheet.aerocars.cc/api/v1/"
echo "   API Docs: https://timesheet.aerocars.cc/docs"
echo ""
echo "🧪 Test Accounts:"
echo "   Super Admin: superadmin@example.com / password123"
echo "   Company Admin: companyadmin@example.com / password123"
echo "   Employee: user@example.com / password123"
echo ""
echo "📝 Next Steps:"
echo "   1. Test the application at the frontend URL"
echo "   2. Verify login functionality"
echo "   3. Check API responses at the backend URL"
echo "   4. Monitor logs if any issues occur"
echo ""
echo "🔧 Troubleshooting:"
echo "   - Frontend issues: Check browser console"
echo "   - Backend issues: ssh root@185.201.8.177 'docker logs timesheet_backend'"
echo "   - Documentation: See DEPLOYMENT.md for detailed information"
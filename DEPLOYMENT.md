# Timesheet System Deployment Guide

This guide covers how to deploy both frontend and backend components of the Timesheet System.

## System Architecture

- **Frontend**: React PWA hosted on Firebase
- **Backend**: FastAPI application running in Docker on VPS
- **Database**: PostgreSQL on VPS (external to application)
- **Domain**: timesheet.aerocars.cc (managed by BaoTa panel)

## Prerequisites

### Local Development Machine
- Node.js (v16 or higher)
- npm or yarn
- Git
- SSH access to VPS
- Firebase CLI: `npm install -g firebase-tools`

### VPS Server (185.201.8.177)
- Docker and Docker Compose installed
- PostgreSQL running on port 5432
- BaoTa panel for nginx configuration
- SSH access configured

## Frontend Deployment

The frontend is deployed to Firebase Hosting for global CDN distribution.

### Quick Deployment
```bash
cd frontend
./deploy.sh
```

### Manual Deployment Steps
```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Firebase
firebase login  # if not already logged in
firebase deploy --only hosting
```

### Frontend Configuration

Environment variables are in `frontend/.env.production`:
```env
VITE_API_BASE_URL=https://timesheet.aerocars.cc/api/v1
VITE_APP_TITLE=Timesheet System
VITE_APP_VERSION=1.0.0
```

### Firebase Project Details
- Project ID: `timesheet-5fff2`
- Primary URL: https://timesheet-5fff2.web.app
- Firebase URL: https://timesheet-5fff2.firebaseapp.com

## Backend Deployment

The backend runs in a Docker container on the VPS server.

### Quick Deployment
```bash
./deploy-backend.sh
```

### Manual Deployment Steps
```bash
# Sync code to VPS
rsync -avz --exclude='frontend/node_modules/' \
           --exclude='frontend/dist/' \
           --exclude='.git/' \
           ./ root@185.201.8.177:/home/docker/timesheet/

# Connect to VPS
ssh root@185.201.8.177

# Navigate to project directory
cd /home/docker/timesheet

# Stop existing container
docker stop timesheet_backend || true
docker rm timesheet_backend || true

# Build and start new container
docker-compose build backend
docker-compose up -d backend

# Check status
docker ps | grep timesheet_backend
docker logs timesheet_backend
```

### Backend Configuration

Environment variables are in `.env` file:
```env
# Database Configuration
POSTGRES_DB=timesheet
POSTGRES_USER=apiuser
POSTGRES_PASSWORD=Devo0932
POSTGRES_HOST=172.19.0.4

# Backend Configuration
SECRET_KEY=TimeSheetSystem2024SecretKeyForJWTTokensVerySecureAndLongEnough123
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=production

# Domain Configuration
DOMAIN=timesheet.aerocars.cc
VPS_IP=185.201.8.177
BACKEND_PORT=8130
```

### Docker Network Configuration

The backend container uses the external network `vps_project_app_network` to connect to PostgreSQL:

```yaml
networks:
  vps_project_app_network:
    external: true
```

## Database Setup

The system uses an existing PostgreSQL database on the VPS.

### Database Details
- Host: 172.19.0.4:5432
- Database: timesheet
- User: apiuser
- Password: Devo0932

### Initial Data
The system includes these test accounts:
- admin@timesheet.com / password123 (super_admin)
- superadmin@example.com / password123 (super_admin)
- companyadmin@example.com / password123 (company_admin)
- user@example.com / password123 (employee)

## SSL and Domain Configuration

SSL is managed through BaoTa panel with nginx configuration.

### Nginx Configuration Location
```
/www/server/panel/vhost/nginx/timesheet.aerocars.cc.conf
```

### Key Configuration Points
- HTTPS redirect for all HTTP requests
- CORS headers for Firebase frontend
- API proxy to backend on port 8130
- SSL certificate: *.aerocars.cc wildcard

## Verification and Testing

### Backend Health Check
```bash
curl https://timesheet.aerocars.cc/health
# Expected: {"status":"healthy","secret_key_prefix":"TimeSheetS"}
```

### API Documentation
Visit: https://timesheet.aerocars.cc/docs

### Frontend Testing
1. Open: https://timesheet-5fff2.web.app
2. Login with: companyadmin@example.com / password123
3. Verify data loads (users, departments)
4. Test attendance check-in (requires location permission)

## Troubleshooting

### Backend Issues

**Container not starting:**
```bash
ssh root@185.201.8.177
cd /home/docker/timesheet
docker logs timesheet_backend
```

**Database connection issues:**
```bash
ssh root@185.201.8.177
docker exec timesheet_backend python -c "
import os
from sqlalchemy import create_engine
engine = create_engine(os.getenv('DATABASE_URL'))
print('Database connection successful')
"
```

**Network connectivity:**
```bash
ssh root@185.201.8.177
docker exec timesheet_backend ping -c 3 172.19.0.4
```

### Frontend Issues

**Build failures:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

**CORS errors:**
- Check nginx configuration on VPS
- Verify API base URL in `.env.production`
- Check browser network tab for 307 redirects

### API Issues

**307 Redirect errors:**
- Ensure API paths include trailing slashes
- Check nginx proxy configuration
- Verify HTTPS redirect settings

**Authentication failures:**
- Check JWT secret key consistency
- Verify user accounts in database
- Test with known good credentials

## Monitoring and Logs

### Backend Logs
```bash
ssh root@185.201.8.177 'docker logs -f timesheet_backend'
```

### Nginx Logs
```bash
ssh root@185.201.8.177 'tail -f /www/wwwlogs/timesheet.aerocars.cc.log'
```

### Database Logs
```bash
ssh root@185.201.8.177 'docker logs my_postgres_db'
```

## Rollback Procedures

### Frontend Rollback
Firebase maintains deployment history. To rollback:
```bash
firebase hosting:versions:list
firebase hosting:versions:clone TARGET_VERSION CURRENT_VERSION
```

### Backend Rollback
```bash
ssh root@185.201.8.177
cd /home/docker/timesheet
git log --oneline -10  # Find commit to rollback to
git checkout COMMIT_HASH
docker-compose build backend
docker-compose up -d backend
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to Git
2. **Database Access**: PostgreSQL is only accessible within Docker network
3. **API Security**: All endpoints require authentication except login
4. **HTTPS**: All traffic is encrypted with SSL certificates
5. **CORS**: Restricted to Firebase frontend domain only

## Performance Optimization

1. **Frontend**: Served via Firebase CDN globally
2. **Backend**: Single container, can be scaled horizontally
3. **Database**: PostgreSQL with connection pooling
4. **Caching**: Browser caching via Firebase hosting headers

## Backup and Recovery

### Database Backup
```bash
ssh root@185.201.8.177
docker exec my_postgres_db pg_dump -U apiuser timesheet > backup_$(date +%Y%m%d).sql
```

### Code Backup
All code is backed up in GitHub repository: https://github.com/jamestw/timesheet

### Configuration Backup
```bash
ssh root@185.201.8.177
cp /www/server/panel/vhost/nginx/timesheet.aerocars.cc.conf ~/nginx_backup_$(date +%Y%m%d).conf
```
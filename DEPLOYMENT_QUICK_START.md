# Timesheet System - Quick Deployment Guide

## 📋 Overview

This timesheet system uses a hybrid deployment architecture:
- **Frontend**: React PWA hosted on Firebase
- **Backend**: FastAPI in Docker on VPS (185.201.8.177)

## 🚀 Quick Deploy Commands

### Deploy Everything (Recommended)
```bash
./deploy-all.sh --all
```

### Deploy Frontend Only
```bash
cd frontend
./deploy.sh
```

### Deploy Backend Only
```bash
./deploy-backend.sh
```

## 📁 Deployment Scripts

| Script | Purpose | Target |
|--------|---------|---------|
| `deploy-all.sh` | Complete deployment with options | Frontend + Backend |
| `frontend/deploy.sh` | Frontend deployment | Firebase |
| `deploy-backend.sh` | Backend deployment | VPS |

## 🔧 Prerequisites

### For Frontend Deployment
- Node.js (v16+)
- Firebase CLI: `npm install -g firebase-tools`
- Firebase login: `firebase login`

### For Backend Deployment
- SSH access to VPS (185.201.8.177)
- Docker installed on VPS
- Git repository access

## 🌐 Application URLs

After successful deployment:

- **Frontend**: https://timesheet-5fff2.web.app
- **Backend API**: https://timesheet.aerocars.cc/api/v1/
- **API Documentation**: https://timesheet.aerocars.cc/docs

## 🧪 Test Accounts

| Email | Password | Role |
|-------|----------|------|
| superadmin@example.com | password123 | Super Admin |
| companyadmin@example.com | password123 | Company Admin |
| user@example.com | password123 | Employee |

## 🔍 Verification Steps

1. **Frontend Check**:
   ```bash
   curl -s https://timesheet-5fff2.web.app | head -5
   ```

2. **Backend Health Check**:
   ```bash
   curl https://timesheet.aerocars.cc/health
   ```

3. **API Test**:
   ```bash
   curl -X POST "https://timesheet.aerocars.cc/api/v1/login/access-token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=companyadmin@example.com&password=password123"
   ```

## 🐛 Troubleshooting

### Frontend Issues
```bash
# Check Firebase project
firebase projects:list

# View build logs
cd frontend && npm run build

# Check browser console for errors
```

### Backend Issues
```bash
# Check container status
ssh root@185.201.8.177 'docker ps | grep timesheet'

# View backend logs
ssh root@185.201.8.177 'docker logs timesheet_backend'

# Check database connection
ssh root@185.201.8.177 'docker exec timesheet_backend python -c "from sqlalchemy import create_engine; import os; engine = create_engine(os.getenv(\"DATABASE_URL\")); print(\"DB connected\")"'
```

## 📋 Deployment Checklist

- [ ] SSH access to VPS configured
- [ ] Firebase CLI installed and authenticated
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Backend container can connect to database
- [ ] SSL certificates working (HTTPS)
- [ ] CORS configured properly
- [ ] Test accounts can login

## 📚 Detailed Documentation

For comprehensive deployment information, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs from the verification steps
3. Consult [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed configuration
4. Check nginx configuration on VPS if CORS issues occur
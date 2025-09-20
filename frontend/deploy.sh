#!/bin/bash

# Timesheet System Frontend Deployment Script
# This script builds and deploys the React frontend to Firebase

set -e  # Exit on any error

echo "🚀 Starting frontend deployment..."

# Ensure we're in the correct directory
cd "$(dirname "$0")"

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the frontend directory."
    exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Error: Firebase CLI not found. Please install it with: npm install -g firebase-tools"
    echo "   Or visit: https://firebase.google.com/docs/cli"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Error: Not logged in to Firebase. Please run: firebase login"
    exit 1
fi

echo "📦 Installing/updating dependencies..."
npm install

echo "🛠️  Building for production..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist directory not found"
    exit 1
fi

echo "☁️  Deploying to Firebase..."
firebase deploy --only hosting

echo ""
echo "✅ Frontend deployment completed successfully!"
echo "🌐 Application URLs:"
echo "   - Primary: https://timesheet-5fff2.web.app"
echo "   - Firebase: https://timesheet-5fff2.firebaseapp.com"
echo ""
echo "📝 Next steps:"
echo "   - Test the deployed application"
echo "   - Verify API connections are working"
echo "   - Check browser console for any errors"
echo "   - Test login with: companyadmin@example.com / password123"
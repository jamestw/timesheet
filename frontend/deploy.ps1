# Timesheet System Frontend Deployment Script (PowerShell)
# This script builds and deploys the React frontend to Firebase

Write-Host "🚀 Starting frontend deployment..." -ForegroundColor Green

# Ensure we're in the correct directory
Set-Location $PSScriptRoot

# Check if we're in the frontend directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the frontend directory." -ForegroundColor Red
    exit 1
}

# Check if Firebase CLI is installed
try {
    firebase --version | Out-Null
} catch {
    Write-Host "❌ Error: Firebase CLI not found. Please install it with: npm install -g firebase-tools" -ForegroundColor Red
    Write-Host "   Or visit: https://firebase.google.com/docs/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Installing/updating dependencies..." -ForegroundColor Blue
npm install

Write-Host "🧹 Cleaning previous build..." -ForegroundColor Blue
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

Write-Host "🛠️ Building for production with HTTPS fix..." -ForegroundColor Blue
npm run build:production

# Check if build was successful
if (-not (Test-Path "dist")) {
    Write-Host "❌ Error: Build failed - dist directory not found" -ForegroundColor Red
    exit 1
}

Write-Host "☁️ Deploying to Firebase..." -ForegroundColor Blue
firebase deploy --only hosting

Write-Host ""
Write-Host "✅ Frontend deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
Write-Host "   - Primary: https://timesheet-5fff2.web.app" -ForegroundColor White
Write-Host "   - Firebase: https://timesheet-5fff2.firebaseapp.com" -ForegroundColor White
Write-Host ""
Write-Host "🔒 Mixed Content Fix Applied - All API calls now use HTTPS" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   - Clear browser cache and test in incognito mode" -ForegroundColor White
Write-Host "   - Check browser console for HTTPS API calls" -ForegroundColor White
Write-Host "   - Verify reports page works without Mixed Content errors" -ForegroundColor White
Write-Host "   - Test login with: companyadmin@example.com / password123" -ForegroundColor White
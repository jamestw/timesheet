#!/bin/bash

# Firebase 部署腳本
echo "🔥 開始 Firebase 部署..."

# 確保在正確目錄
cd "$(dirname "$0")"

# 安裝依賴 (如果需要)
echo "📦 檢查依賴..."
npm install

# 建置專案
echo "🏗️ 建置前端專案..."
npm run build

# 檢查建置是否成功
if [ ! -d "dist" ]; then
    echo "❌ 建置失敗，dist 目錄不存在"
    exit 1
fi

# 部署到 Firebase
echo "🚀 部署到 Firebase Hosting..."
firebase deploy --only hosting

echo "✅ 部署完成！"
echo "🌐 網站 URL: https://timesheet-5fff2.firebaseapp.com"
echo "🌐 自訂域名 URL: https://timesheet-5fff2.web.app"
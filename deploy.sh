#!/bin/bash

# 部署到正式機的腳本
echo "🚀 開始部署 Timesheet System..."

# 設定變數
APP_DIR="/var/www/timesheet"
SERVICE_NAME="timesheet-api"
NGINX_SERVICE="nginx"

# 1. 進入應用目錄
cd $APP_DIR

# 2. 拉取最新程式碼
echo "📥 拉取最新程式碼..."
git pull origin master

# 3. 備份資料庫
echo "💾 備份資料庫..."
cp sql_app.db sql_app.db.backup.$(date +%Y%m%d_%H%M%S)

# 4. 安裝 Python 依賴
echo "🐍 安裝 Python 依賴..."
pip install -r requirements.txt

# 5. 建置前端
echo "⚛️ 建置前端..."
cd frontend
npm install
npm run build
cd ..

# 6. 執行資料庫遷移（如果有的話）
echo "🗄️ 執行資料庫遷移..."
if [ -f "run_migration.py" ]; then
    python run_migration.py
fi

# 7. 重啟服務
echo "🔄 重啟服務..."
sudo systemctl restart $SERVICE_NAME
sudo systemctl restart $NGINX_SERVICE

# 8. 檢查服務狀態
echo "✅ 檢查服務狀態..."
sudo systemctl status $SERVICE_NAME --no-pager -l

echo "🎉 部署完成！"
echo "🌐 請檢查網站是否正常運作"
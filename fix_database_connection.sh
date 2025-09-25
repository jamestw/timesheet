#!/bin/bash

echo "🔧 修復 VPS 資料庫連線設定..."

VPS_SERVER="root@185.201.8.177"
PROJECT_PATH="/home/docker/timesheet"

# 1. 複製正確的 .env 檔案
echo "📁 更新 .env 檔案..."
scp .env.vps $VPS_SERVER:$PROJECT_PATH/.env

# 2. 在 VPS 上確認環境變數
echo "🔍 檢查 VPS 環境變數..."
ssh $VPS_SERVER << 'EOF'
cd /home/docker/timesheet
echo "=== 檢查 .env 檔案內容 ==="
grep DATABASE_URL .env

echo "=== 完全重啟 Docker 容器 ==="
# 停止所有容器
docker-compose down --remove-orphans

# 清除可能的快取
docker system prune -f

# 重新啟動容器
docker-compose up --build -d

echo "=== 等待服務啟動 ==="
sleep 15

echo "=== 檢查容器狀態 ==="
docker-compose ps

echo "=== 檢查後端日誌 ==="
docker-compose logs backend | tail -10
EOF

echo "✅ 修復完成！"
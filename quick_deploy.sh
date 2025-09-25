#!/bin/bash

echo "🚀 快速部署修復到 VPS..."

VPS_SERVER="root@185.201.8.177"
PROJECT_PATH="/home/docker/timesheet"

# 1. 複製關鍵修復檔案
echo "📁 複製修復檔案..."
scp .env.vps $VPS_SERVER:$PROJECT_PATH/.env
scp app/schemas/department.py $VPS_SERVER:$PROJECT_PATH/app/schemas/
scp setup_minimal_proxy.sh $VPS_SERVER:$PROJECT_PATH/

# 2. 重啟服務
echo "🔄 重啟後端服務..."
ssh $VPS_SERVER << 'EOF'
cd /home/docker/timesheet
docker-compose restart backend
sleep 10
docker-compose ps
EOF

# 3. 設置 Nginx 代理
echo "🔧 設置 Nginx 代理..."
ssh $VPS_SERVER << 'EOF'
cd /home/docker/timesheet
chmod +x setup_minimal_proxy.sh
./setup_minimal_proxy.sh
EOF

echo "✅ 快速部署完成！"
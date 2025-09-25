#!/bin/bash

# 設定最小化 Nginx 代理 - 避免與寶塔管理衝突
# 使用 port 8080 避免與寶塔的 80/443 衝突

echo "🔧 設定最小化 Nginx 代理 (port 8080)..."

# 1. 檢查是否已安裝 nginx
if ! command -v nginx &> /dev/null; then
    echo "📦 安裝 Nginx..."
    apt update
    apt install -y nginx
fi

# 2. 創建獨立的 timesheet proxy 配置 (使用 port 8080)
cat > /etc/nginx/sites-available/timesheet-proxy << 'EOF'
server {
    listen 8080;
    server_name 185.201.8.177;

    location /api/v1/ {
        proxy_pass http://127.0.0.1:8001/api/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers for Firebase hosting
        add_header Access-Control-Allow-Origin "https://timesheet-5fff2.web.app" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
        add_header Access-Control-Allow-Credentials "true" always;

        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://timesheet-5fff2.web.app";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept";
            add_header Access-Control-Allow-Credentials "true";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:8001/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 3. 啟用 timesheet proxy 站點 (不影響現有站點)
if [ ! -f /etc/nginx/sites-enabled/timesheet-proxy ]; then
    ln -s /etc/nginx/sites-available/timesheet-proxy /etc/nginx/sites-enabled/
fi

# 4. 檢查配置語法
nginx -t

if [ $? -eq 0 ]; then
    # 5. 重新載入 Nginx (不影響其他服務)
    systemctl reload nginx

    echo "✅ 最小化 Nginx 代理設定完成！"
    echo "📝 API 現在可以通過 http://185.201.8.177:8080/api/v1 訪問"
    echo "🔗 前端需要更新 API URL 為: http://185.201.8.177:8080/api/v1"
    echo "🚀 這不會影響寶塔管理的其他服務"
else
    echo "❌ Nginx 配置測試失敗，請檢查配置"
    exit 1
fi
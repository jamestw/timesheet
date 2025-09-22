#!/bin/bash

# 在 VPS 上設定 Nginx + SSL 的快速腳本

echo "🔧 設定 Nginx 反向代理 + SSL..."

# 1. 安裝 Nginx
apt update
apt install -y nginx certbot python3-certbot-nginx

# 2. 創建 Nginx 配置
cat > /etc/nginx/sites-available/timesheet-api << 'EOF'
server {
    listen 80;
    server_name 185.201.8.177;

    location / {
        proxy_pass http://127.0.0.1:8130;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers
        add_header Access-Control-Allow-Origin "https://timesheet-5fff2.web.app" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
        add_header Access-Control-Allow-Credentials "true" always;

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
EOF

# 3. 啟用站點
ln -sf /etc/nginx/sites-available/timesheet-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 4. 測試配置
nginx -t

# 5. 重啟 Nginx
systemctl restart nginx
systemctl enable nginx

echo "✅ Nginx 設定完成！"
echo "📝 API 現在可以通過 http://185.201.8.177 訪問"
echo "🔗 前端需要更新 API URL 為: http://185.201.8.177"
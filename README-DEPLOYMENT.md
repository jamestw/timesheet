# 🚀 生產環境部署指南

## 📋 部署概覽

此專案已配置完整的 Docker 化生產環境，包含：
- FastAPI 後端 (PostgreSQL)
- React 前端 (PWA)
- Nginx 反向代理
- SSL/HTTPS 支援
- 自動化部署腳本

## 🎯 快速部署

### 1. VPS 前置需求

```bash
# 更新系統
sudo apt update && sudo apt upgrade -y

# 安裝 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安裝 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 重新登入以套用 Docker 群組權限
logout
```

### 2. 專案部署

```bash
# 克隆專案到 VPS
git clone <your-repo-url> /opt/timesheet-system
cd /opt/timesheet-system

# 配置環境變數
cp .env.prod .env
nano .env  # 編輯配置

# 執行自動化部署
./deploy.sh
```

### 3. 環境變數配置

編輯 `.env` 檔案：

```bash
# 資料庫配置
POSTGRES_DB=timesheet_db
POSTGRES_USER=timesheet_user
POSTGRES_PASSWORD=your_secure_password_here

# 後端配置
SECRET_KEY=your_very_secure_secret_key_minimum_32_characters
ENVIRONMENT=production

# 域名配置
DOMAIN=your-domain.com
SSL_EMAIL=your-email@example.com

# 管理員密碼 (首次部署)
ADMIN_PASSWORD=admin123
```

## 🔧 手動部署步驟

如果需要手動控制部署流程：

### 1. 準備環境

```bash
# 建立目錄
sudo mkdir -p /opt/timesheet-system
sudo chown -R $USER:$USER /opt/timesheet-system

# 複製檔案
cp -r . /opt/timesheet-system/
cd /opt/timesheet-system
```

### 2. SSL 憑證設定

```bash
# 安裝 Certbot
sudo apt install certbot

# 取得 SSL 憑證
sudo certbot certonly --standalone \
  --email your-email@example.com \
  --agree-tos \
  -d your-domain.com

# 複製憑證到 Nginx 目錄
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
```

### 3. 啟動服務

```bash
# 建置並啟動所有服務
docker-compose up --build -d

# 建立初始管理員帳號
docker-compose exec backend python /app/create_initial_admin.py
```

## 🎛️ 管理指令

```bash
# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f

# 重啟服務
docker-compose restart

# 停止服務
docker-compose down

# 更新部署
./deploy.sh update

# 備份資料
./deploy.sh backup
```

## 🔐 安全設定

### 防火牆配置

```bash
# 啟用 UFW
sudo ufw enable

# 允許必要端口
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### SSL 憑證自動續期

```bash
# 設定 Crontab 自動續期
sudo crontab -e

# 新增以下行 (每天檢查並續期)
0 12 * * * /usr/bin/certbot renew --quiet && docker-compose exec nginx nginx -s reload
```

## 📊 監控與維護

### 健康檢查

```bash
# 檢查前端
curl https://your-domain.com/health

# 檢查後端 API
curl https://your-domain.com/api/health
```

### 日誌監控

```bash
# 即時查看所有日誌
docker-compose logs -f

# 查看特定服務日誌
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### 資料備份

```bash
# 備份 PostgreSQL 資料庫
docker-compose exec db pg_dump -U timesheet_user timesheet_db > backup_$(date +%Y%m%d).sql

# 備份整個部署
./deploy.sh backup
```

## 🌐 域名與 DNS 設定

1. **購買域名** 並設定 DNS A 記錄指向您的 VPS IP
2. **等待 DNS 傳播** (通常需要 10-30 分鐘)
3. **測試域名解析**：`nslookup your-domain.com`

## 📱 首次使用

1. **訪問系統**：`https://your-domain.com`
2. **登入管理員帳號**：
   - Email: `admin@timesheet.com`
   - Password: 環境變數中設定的密碼
3. **更改管理員密碼**
4. **設定公司資訊** 和地理位置

## 🆘 故障排除

### 常見問題

1. **容器無法啟動**
   ```bash
   docker-compose logs <service_name>
   ```

2. **SSL 憑證問題**
   ```bash
   sudo certbot certificates
   sudo certbot renew --dry-run
   ```

3. **資料庫連線失敗**
   ```bash
   docker-compose exec db psql -U timesheet_user -d timesheet_db
   ```

4. **端口被佔用**
   ```bash
   sudo netstat -tlnp | grep :80
   sudo netstat -tlnp | grep :443
   ```

### 重置部署

```bash
# 完全清理並重新部署
docker-compose down -v
docker system prune -f
./deploy.sh
```

## 📞 支援

如遇到問題，請檢查：
1. 服務日誌：`docker-compose logs`
2. 系統資源：`htop`, `df -h`
3. 網路連線：`ping`, `curl`

---

**重要提醒**：
- 定期備份資料庫
- 監控系統資源使用
- 保持 Docker 映像檔更新
- 定期檢查 SSL 憑證有效期
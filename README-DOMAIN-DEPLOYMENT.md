# 🌐 域名部署指南 - timesheet.aerocars.cc

## 🎉 完整的 HTTPS 部署方案

您已經設定好 Cloudflare DNS，現在可以使用完整的域名和 SSL 憑證進行部署！

### ✅ 配置摘要

- **域名**: `timesheet.aerocars.cc`
- **SSL**: Let's Encrypt 自動憑證
- **代理**: Nginx 反向代理
- **前端**: React PWA (HTTPS)
- **後端**: FastAPI (內部 8001)
- **資料庫**: 現有 PostgreSQL (5432)

## 🚀 一鍵部署

### 1. 準備環境配置

```bash
# 複製域名配置
cp .env.vps .env

# 編輯配置檔案
nano .env
```

### 2. 必要的環境變數

```bash
# 域名配置
DOMAIN=timesheet.aerocars.cc
SSL_EMAIL=your-email@example.com

# 資料庫配置
POSTGRES_DB=timesheet_db
POSTGRES_USER=timesheet_user
POSTGRES_PASSWORD=your_secure_password

# 後端配置
SECRET_KEY=your_very_secure_secret_key_minimum_32_characters
ADMIN_PASSWORD=admin123

# API 配置
VITE_API_BASE_URL=https://timesheet.aerocars.cc/api/v1
```

### 3. 執行完整部署

```bash
# 一鍵部署 (包含 SSL 設定)
./deploy-domain.sh deploy
```

## 🌐 部署後訪問

部署完成後，您可以通過以下 HTTPS 地址訪問：

- **主應用**: https://timesheet.aerocars.cc
- **API 文件**: https://timesheet.aerocars.cc/api/docs
- **健康檢查**: https://timesheet.aerocars.cc/health

## 🔐 SSL 憑證管理

### 自動申請 SSL

部署腳本會自動：
1. 申請 Let's Encrypt 免費 SSL 憑證
2. 配置 Nginx HTTPS
3. 設定自動續期 (每月執行)

### 手動續期 SSL

```bash
# 手動續期 SSL 憑證
./deploy-domain.sh ssl
```

## 🏗️ 架構說明

```
Internet → Cloudflare → Nginx (80/443) → Frontend (80) ↘
                                      → Backend (8001) → PostgreSQL (5432)
```

### 服務配置

| 服務 | 容器端口 | 外部端口 | 說明 |
|------|----------|----------|------|
| Nginx | 80/443 | 80/443 | 反向代理 + SSL |
| Frontend | 80 | - | React 應用 |
| Backend | 8001 | - | FastAPI |
| Certbot | - | - | SSL 憑證管理 |

## 🔧 管理指令

```bash
# 查看服務狀態
./deploy-domain.sh status

# 查看實時日誌
./deploy-domain.sh logs

# 重啟所有服務
./deploy-domain.sh restart

# 更新應用
./deploy-domain.sh update

# 停止服務
./deploy-domain.sh stop

# SSH 到 VPS
./deploy-domain.sh ssh
```

## 📱 PWA 功能

部署後的應用支援 PWA 功能：
- 📱 可安裝到手機桌面
- 🔄 離線緩存
- 📍 GPS 定位打卡
- 📊 本地數據存儲

## 🔒 安全功能

### HTTPS 安全

- ✅ TLS 1.2/1.3 加密
- ✅ HSTS 安全標頭
- ✅ XSS 保護
- ✅ CSRF 防護

### API 安全

- 🔑 JWT 令牌驗證
- 🚫 API 速率限制
- 🛡️ CORS 配置
- 🔐 密碼雜湊

## 🗄️ 資料庫管理

### 連接現有 PostgreSQL

系統會使用您現有的 `my_postgres_db` 容器：

```bash
# 查看資料庫
docker exec -it my_postgres_db psql -U postgres

# 切換到時間打卡系統資料庫
\c timesheet_db

# 查看表格
\dt
```

### 備份與還原

```bash
# 備份資料庫
docker exec my_postgres_db pg_dump -U timesheet_user timesheet_db > backup_$(date +%Y%m%d).sql

# 還原資料庫
docker exec -i my_postgres_db psql -U timesheet_user timesheet_db < backup.sql
```

## 📊 監控與日誌

### 健康檢查

```bash
# 檢查所有服務
curl https://timesheet.aerocars.cc/health

# 檢查 API
curl https://timesheet.aerocars.cc/api/health

# 檢查 SSL 憑證
openssl s_client -connect timesheet.aerocars.cc:443 -servername timesheet.aerocars.cc
```

### 日誌查看

```bash
# 查看所有日誌
docker-compose logs -f

# 查看特定服務
docker-compose logs -f nginx
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🌐 Cloudflare 設定建議

### DNS 設定

確保在 Cloudflare 中：
- A 記錄：`timesheet` → `185.201.8.177`
- 代理狀態：可開啟 🧡 (建議)

### 安全設定

在 Cloudflare 面板中建議啟用：
- 🛡️ DDoS 保護
- 🔒 Always Use HTTPS
- 🚀 Brotli 壓縮
- 📱 Mobile Redirect (可選)

## 📝 首次使用指南

1. **訪問系統**: https://timesheet.aerocars.cc
2. **登入管理員**:
   - Email: `admin@timesheet.com`
   - Password: 環境變數中的 `ADMIN_PASSWORD`
3. **更改密碼**: 立即修改管理員密碼
4. **設定公司資訊**:
   - 公司名稱和地址
   - GPS 座標 (用於定位打卡)
5. **建立部門和員工帳號**
6. **測試打卡功能**

## 🆘 故障排除

### SSL 憑證問題

```bash
# 檢查憑證狀態
./deploy-domain.sh ssl

# 查看 certbot 日誌
docker-compose logs certbot

# 手動申請憑證
docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot --email your-email@example.com --agree-tos -d timesheet.aerocars.cc
```

### 服務無法啟動

```bash
# 檢查容器狀態
docker-compose ps

# 查看詳細日誌
docker-compose logs --tail=100

# 重新建置
docker-compose down
docker-compose up --build -d
```

### 網域無法訪問

1. 檢查 DNS 傳播：`nslookup timesheet.aerocars.cc`
2. 檢查防火牆：`ufw status`
3. 檢查 Nginx 配置：`docker-compose exec nginx nginx -t`

## 📞 技術支援

系統運行問題檢查清單：
- [ ] DNS 解析正常
- [ ] SSL 憑證有效
- [ ] 所有容器運行中
- [ ] 資料庫連線正常
- [ ] 磁碟空間充足

---

**恭喜！** 您的時間打卡系統現在已經完整部署在 `https://timesheet.aerocars.cc` 🎉
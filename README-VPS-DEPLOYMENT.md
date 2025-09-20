# 🚀 VPS 部署指南 (185.201.8.177)

## 📋 針對您的 VPS 的專用部署方案

基於您的 VPS 環境分析，我已經調整配置以避免所有端口衝突並使用現有的 PostgreSQL 資料庫。

### 🎯 端口配置

| 服務 | 端口 | 說明 |
|------|------|------|
| 後端 API | 8130 | 避免與現有服務衝突 (8000, 8110, 8120) |
| 前端應用 | 3020 | 避免與 goodconn 衝突 (3010) |
| PostgreSQL | 5432 | 使用現有的 my_postgres_db 容器 |

## 🚀 快速部署

### 1. 本地準備

```bash
# 克隆或切換到專案目錄
cd /path/to/TimesheetSystemV2

# 建立 VPS 環境配置
cp .env.vps .env

# 編輯環境變數
nano .env
```

### 2. 配置 .env 檔案

```bash
# 資料庫配置 (使用現有的 PostgreSQL)
POSTGRES_DB=timesheet_db
POSTGRES_USER=timesheet_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_HOST=172.17.0.1

# 後端配置
SECRET_KEY=your_very_secure_secret_key_for_jwt_tokens_minimum_32_characters
ENVIRONMENT=production

# 管理員密碼
ADMIN_PASSWORD=admin123
```

### 3. 執行部署

```bash
# 一鍵部署到 VPS
./deploy-vps.sh deploy
```

## 🔧 手動部署步驟

如果需要分步驟部署：

### 1. 上傳檔案到 VPS

```bash
# 使用 rsync 同步檔案
rsync -avz --delete \
    --exclude='.git/' \
    --exclude='node_modules/' \
    --exclude='*.log' \
    ./ root@185.201.8.177:/home/docker/timesheet/
```

### 2. SSH 到 VPS 並設定

```bash
# SSH 連接到 VPS
ssh root@185.201.8.177

# 切換到專案目錄
cd /home/docker/timesheet

# 建立資料庫和使用者
docker exec my_postgres_db psql -U postgres -c "CREATE DATABASE timesheet_db;"
docker exec my_postgres_db psql -U postgres -c "CREATE USER timesheet_user WITH PASSWORD 'your_password';"
docker exec my_postgres_db psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE timesheet_db TO timesheet_user;"
```

### 3. 啟動服務

```bash
# 建置並啟動服務
docker-compose up --build -d

# 建立初始管理員
docker-compose exec backend python /app/create_initial_admin.py

# 檢查狀態
docker-compose ps
```

## 📊 服務訪問

部署完成後，您可以通過以下地址訪問：

- **前端應用**: http://185.201.8.177:3020
- **後端 API**: http://185.201.8.177:8130
- **API 文件**: http://185.201.8.177:8130/docs

## 🔧 管理指令

```bash
# 查看服務狀態
./deploy-vps.sh status

# 查看日誌
./deploy-vps.sh logs

# 重啟服務
./deploy-vps.sh restart

# 更新部署
./deploy-vps.sh update

# 停止服務
./deploy-vps.sh stop

# SSH 到 VPS
./deploy-vps.sh ssh
```

## 🗄️ 資料庫配置

### 使用現有 PostgreSQL

```bash
# 連接到現有的 PostgreSQL 容器
docker exec -it my_postgres_db psql -U postgres

# 查看現有資料庫
\l

# 切換到時間打卡系統資料庫
\c timesheet_db

# 查看表格
\dt
```

### 備份與還原

```bash
# 備份資料庫
docker exec my_postgres_db pg_dump -U timesheet_user timesheet_db > timesheet_backup_$(date +%Y%m%d).sql

# 還原資料庫
docker exec -i my_postgres_db psql -U timesheet_user timesheet_db < timesheet_backup.sql
```

## 🔐 安全考量

### 1. 防火牆設定

```bash
# 檢查當前防火牆狀態
ufw status

# 如需要，開放新端口
ufw allow 8130/tcp  # 後端 API
ufw allow 3020/tcp  # 前端應用
```

### 2. 更改預設密碼

首次登入後務必：
1. 登入 http://185.201.8.177:3020
2. 使用 admin@timesheet.com / admin123 登入
3. 立即更改管理員密碼
4. 設定公司資訊和地理位置

## 🎯 系統特色

### GPS 定位打卡
- 📍 100公尺範圍限制
- 🔒 防止遠程打卡
- 📱 支援 PWA 移動端

### 多租戶架構
- 🏢 獨立公司數據
- 👥 角色權限管理
- 📊 出勤報表系統

## 🆘 故障排除

### 常見問題

1. **容器啟動失敗**
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

2. **資料庫連線錯誤**
   ```bash
   # 檢查 PostgreSQL 容器狀態
   docker ps | grep postgres

   # 測試連線
   docker exec my_postgres_db psql -U timesheet_user -d timesheet_db -c "SELECT 1;"
   ```

3. **端口衝突**
   ```bash
   # 檢查端口使用情況
   netstat -tlnp | grep :8130
   netstat -tlnp | grep :3020
   ```

4. **前端無法連接後端**
   - 檢查 .env 中的 VITE_API_BASE_URL 設定
   - 確認後端容器正常運行
   - 檢查防火牆設定

### 重置部署

```bash
# 完全重置
./deploy-vps.sh stop
docker system prune -f
./deploy-vps.sh deploy
```

## 📞 支援資訊

如遇問題，請檢查：
1. VPS 資源使用情況：`htop`, `df -h`
2. Docker 容器狀態：`docker ps`
3. 服務日誌：`docker-compose logs`
4. 網路連線：`curl http://localhost:8130/health`

---

**下一步**：
1. 測試系統功能
2. 設定公司地理位置
3. 建立部門和員工帳號
4. 配置 SSL 憑證（可選）
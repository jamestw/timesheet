# 🚀 快速部署指南

## 📋 現況確認

- ✅ VPS: `root@185.201.8.177`
- ✅ 目標目錄: `/home/docker/timesheet` (目前為空)
- ✅ 域名: `timesheet.aerocars.cc` (Cloudflare DNS 已設定)
- ✅ 現有服務: PostgreSQL 在 port 5432

## 🎯 一鍵部署流程

### 步驟 1: 執行部署腳本

```bash
# 在本地專案目錄執行
./deploy-domain.sh deploy
```

### 部署腳本會自動執行：

1. **檔案同步** 📂
   - 將所有專案檔案複製到 VPS `/home/docker/timesheet`
   - 包含 Docker 配置、程式碼、腳本等

2. **環境設定** ⚙️
   - 自動建立 `.env` 檔案 (從 `.env.vps` 模板)
   - 提示您確認或修改配置

3. **Docker 安裝** 🐳
   - 檢查並安裝 Docker 和 Docker Compose (如需要)

4. **資料庫設定** 🗄️
   - 在現有 PostgreSQL 中建立 `timesheet_db`
   - 建立使用者 `timesheet_user`

5. **服務啟動** 🚀
   - 建置並啟動所有 Docker 容器
   - 後端 API + 前端 + Nginx

6. **SSL 憑證** 🔒
   - 自動申請 Let's Encrypt 憑證
   - 配置 HTTPS

7. **初始設定** 👤
   - 建立管理員帳號
   - 健康檢查

## 📝 部署期間的互動

部署過程中會看到環境變數配置，您可以：

```bash
📝 Please review and edit .env file with your configuration:
  - POSTGRES_PASSWORD=your_secure_password        # 🔑 設定資料庫密碼
  - SECRET_KEY=your_very_secure_secret_key       # 🔐 設定 JWT 密鑰
  - SSL_EMAIL=your-email@example.com             # 📧 SSL 憑證 Email
  - ADMIN_PASSWORD=your_admin_password           # 👤 管理員密碼

Current .env content:
[顯示目前配置]

Press Enter to continue with current settings, or Ctrl+C to exit and edit manually...
```

**選擇：**
- **Enter**: 使用預設配置繼續部署
- **Ctrl+C**: 中斷部署，手動編輯後重新執行

## 🎉 部署完成後

### 訪問地址

- **主應用**: https://timesheet.aerocars.cc
- **API 文件**: https://timesheet.aerocars.cc/api/docs
- **健康檢查**: https://timesheet.aerocars.cc/health

### 登入資訊

- **Email**: `admin@timesheet.com`
- **Password**: 環境變數中的 `ADMIN_PASSWORD`

## 🔧 後續管理

```bash
# 查看服務狀態
./deploy-domain.sh status

# 查看即時日誌
./deploy-domain.sh logs

# 重啟服務
./deploy-domain.sh restart

# 更新應用
./deploy-domain.sh update

# 續期 SSL
./deploy-domain.sh ssl

# SSH 到 VPS
./deploy-domain.sh ssh
```

## 🆘 如果部署中斷

### 重新開始部署

```bash
# 重新執行部署
./deploy-domain.sh deploy
```

### 手動編輯配置

```bash
# SSH 到 VPS
ssh root@185.201.8.177

# 進入專案目錄
cd /home/docker/timesheet

# 編輯環境變數
nano .env

# 重新啟動服務
docker-compose up --build -d
```

## 📞 常見問題

### Q: 部署失敗怎麼辦？
```bash
# 查看詳細日誌
./deploy-domain.sh logs

# 檢查服務狀態
./deploy-domain.sh status
```

### Q: 無法訪問 HTTPS？
- 等待 DNS 傳播 (5-30 分鐘)
- 檢查 Cloudflare 設定
- 檢查防火牆端口 80/443

### Q: 想修改配置？
```bash
# SSH 到 VPS 編輯
ssh root@185.201.8.177
cd /home/docker/timesheet
nano .env
docker-compose restart
```

---

**準備好了嗎？執行 `./deploy-domain.sh deploy` 開始部署！** 🚀
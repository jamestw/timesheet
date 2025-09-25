# Mixed Content 問題解決方案

## 問題描述

在 Firebase Hosting (HTTPS) 中，出現 Mixed Content 錯誤：
```
Mixed Content: The page at 'https://timesheet-5fff2.web.app/admin/users' was loaded over HTTPS, but requested an insecure XMLHttpRequest endpoint 'http://timesheet-api.aerocars.cc/api/v1/companies/3/users/'. This request has been blocked; the content must be served over HTTPS.
```

## 根本原因

**FastAPI 路由重定向機制導致 HTTPS → HTTP**

1. **前端呼叫**：`GET /api/v1/companies/3/users` (無斜線)
2. **後端路由定義**：
   ```python
   # main.py
   app.include_router(users.router, prefix="/api/v1/companies/{company_id}/users")

   # users.py
   @router.get("/", response_model=List[User])  # 有斜線
   ```
3. **實際路由**：`/api/v1/companies/3/users/` (結尾有斜線)
4. **FastAPI 行為**：自動發送 **307 Temporary Redirect** 將無斜線 URL 重定向到有斜線的 URL
5. **重定向問題**：307 重定向預設使用 HTTP 而非 HTTPS

## 解決方案

### 方案一：修復後端路由定義 ✅ (已採用)

將後端路由的根路徑從 `"/"` 改為 `""`，避免路由前綴與根路徑結合時產生雙斜線：

**修改檔案**：
- `app/api/routers/users.py`
- `app/api/routers/departments.py`

**修改內容**：
```python
# Before
@router.get("/", response_model=List[User])
@router.post("/", response_model=User)

# After
@router.get("", response_model=List[User])
@router.post("", response_model=User)
```

**結果**：
- 前端呼叫：`/api/v1/companies/3/users`
- 後端路由：`/api/v1/companies/3/users`
- ✅ 完全匹配，無重定向

### 方案二：前端 API URL 強制 HTTPS ✅ (輔助)

修改 `frontend/src/services/api.ts`：

```typescript
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8001/api/v1';
  }

  // 強制所有線上環境使用 HTTPS
  return 'https://timesheet-api.aerocars.cc/api/v1';
};
```

### 方案三：Service Worker 強制更新 ✅ (輔助)

修改 `frontend/vite.config.ts`：

```typescript
VitePWA({
  workbox: {
    skipWaiting: true,
    clientsClaim: true,
  },
})
```

## 測試驗證

使用 Playwright 自動化測試：

```javascript
// test-api-url.js
page.on('request', request => {
  const url = request.url();
  if (url.includes('/api/v1/')) {
    const protocol = url.startsWith('https://') ? '🔒 HTTPS' : '🚨 HTTP';
    console.log(`${protocol}: ${url}`);
  }
});
```

**修復前**：
```
🔒 HTTPS: https://timesheet-api.aerocars.cc/api/v1/companies/3/users
🚨 HTTP: http://timesheet-api.aerocars.cc/api/v1/companies/3/users/  ← 307 重定向
```

**修復後**：
```
🔒 HTTPS: https://timesheet-api.aerocars.cc/api/v1/companies/3/users
📥 Response 200: https://timesheet-api.aerocars.cc/api/v1/companies/3/users  ← 正常回應
```

## 其他修復

1. **移除前端 API URL 斜線**：
   - `frontend/src/pages/admin/Attendance.tsx`
   - `frontend/src/pages/admin/Users.tsx`
   - `frontend/src/pages/admin/Departments.tsx`
   - `frontend/src/pages/admin/UserApproval.tsx`

2. **SSL 代理配置**：
   - 設定 `proxy_set_header X-Forwarded-Proto $scheme;`
   - 確保後端知道原始請求協議

## 教訓

1. **FastAPI 路由設計**：注意前綴與路由路徑的結合，避免不必要的斜線
2. **HTTPS 重定向**：自動重定向可能不會保持原始協議
3. **Mixed Content 政策**：HTTPS 頁面嚴格禁止 HTTP 資源
4. **端到端測試**：使用 Playwright 等工具驗證實際網路請求

## 檔案變更清單

### 後端修改
- ✅ `app/api/routers/users.py` - 移除根路由斜線
- ✅ `app/api/routers/departments.py` - 移除根路由斜線

### 前端修改
- ✅ `frontend/src/services/api.ts` - 強制 HTTPS API URL
- ✅ `frontend/vite.config.ts` - Service Worker 強制更新
- ✅ `frontend/src/pages/admin/*.tsx` - 移除 API URL 斜線

### 工具檔案
- ✅ `test-api-url.js` - Playwright 診斷工具
- ✅ `proxy_fixed.txt` - Nginx 代理配置範例

---

**狀態**：✅ 已解決
**測試**：✅ 通過
**部署**：✅ 生產環境正常運行
產品需求文件 (PRD) - 企業智慧考勤管理系統
文件版本： 2.0
日期： 2024-09-20
作者： AI Assistant
更新： 新增基於地理位置的智能打卡系統
1. 簡介與目標 (Introduction & Goals)
1.1 產品名稱： 企業智慧考勤管理系統 (Smart Attendance & Timesheet System)
1.2 產品概述：
本系統旨在為多公司提供一個高效、彈性且易於使用的打卡與考勤管理解決方案。透過 PWA (Progressive Web App) 技術實現移動端打卡及申請，並提供強大的 Web 後台管理功能，滿足企業對員工出勤、加班、請假等事務的精確記錄、管理與報表需求。系統採用多租戶架構，確保各公司數據獨立且安全。
1.3 核心目標：
簡化員工上下班打卡流程。
實現精確的地理位置定位打卡，防止代打卡。
提供方便的加班與請假申請及審核流程。
實現企業員工、部門、考勤規則的靈活管理。
自動化生成月度出勤報表，提高薪資計算效率。
支援多公司獨立運營與數據管理。
降低企業在考勤管理上的時間與人力成本。
2. 用戶角色 (User Roles)
系統主要分為三種用戶角色，每種角色擁有不同的權限與功能。
2.1 員工 (Employee)：
主要任務： 上下班打卡、提交加班/請假申請、查詢個人出勤記錄。
訪問介面： PWA (Progressive Web App)
2.2 部門主管 (Department Head)：
主要任務： 審核所屬部門員工的加班/請假申請、查看部門出勤概況。
訪問介面： Web 後台管理系統
2.3 公司管理員 (Company Administrator)：
主要任務： 管理公司員工、部門、考勤規則；審核所有加班/請假申請；查看、匯出所有出勤報表；管理公司系統設置。
訪問介面： Web 後台管理系統
3. 功能需求 (Functional Requirements)
3.1 PWA 員工端功能 (Employee PWA Features)
FR-EMP-001 登入/登出：
員工使用帳號密碼登入系統。
提供忘記密碼功能。
登出後清除會話信息。
FR-EMP-002 上下班打卡 (已實現基於地理位置的智能打卡系統)：
✅ 提供「上班打卡」和「下班打卡」按鈕。
✅ 點擊打卡時，自動獲取用戶當前 GPS 位置 (要求高精度定位)。
✅ 實時計算與公司設定位置的距離，確保在 100 公尺範圍內才能打卡。
✅ 使用 Haversine 公式精確計算地理距離，防止遠程打卡。
✅ 打卡成功後顯示詳細信息：打卡時間、距離公司位置的實際距離。
✅ 完整的錯誤處理：位置權限拒絕、GPS 無法獲取、距離超出範圍等。
✅ 顯示今日已打卡狀態 (例如：已上班打卡、已下班打卡)。
✅ 可查看最近一次打卡記錄。
✅ 後端記錄完整的打卡地理位置資訊 (緯度、經度)。
✅ 智能後退相容：如果公司未設定地理位置，仍允許正常打卡。
FR-EMP-003 加班申請：
員工可填寫加班申請表單：包含加班日期、起止時間、加班事由。
提交申請後，顯示待審核狀態。
可查看歷史加班申請記錄及其審核狀態。
FR-EMP-004 請假申請：
員工可填寫請假申請表單：包含請假類型 (事假、病假、年假等)、起止日期/時間、請假事由。
提交申請後，顯示待審核狀態。
可查看歷史請假申請記錄及其審核狀態。
FR-EMP-005 個人出勤查詢：
提供月曆視圖，標示每日出勤狀態 (正常、遲到、早退、請假、加班等)。
點擊特定日期，可查看當日詳細打卡時間、加班時數、請假記錄等。
FR-EMP-006 推播通知：
接收來自系統的打卡提醒、申請審核結果通知。
需要用戶授權瀏覽器推播通知權限。
FR-EMP-007 離線模式 (PWA 特定)：
在無網路狀況下，PWA 可加載已快取內容。
可嘗試在離線狀態下提交打卡/申請 (數據暫存，聯網後同步)。
3.2 Web 後台管理系統功能 (Web Admin Features)
FR-ADM-001 多公司註冊與登入：
新公司可在系統中註冊帳號，成為新的租戶。
不同公司管理員使用各自帳號登入，數據互相隔離。
FR-ADM-002 公司信息管理 (已實現地理位置管理功能)：
✅ 管理公司名稱、地址、聯絡方式等基本信息。
✅ 設定公司地理位置：經度 (longitude) 和緯度 (latitude)。
✅ 完整的公司資料編輯介面，包含地理位置坐標輸入欄位。
✅ 支援 super_admin 和 company_admin 角色的權限管理。
✅ 地理位置設定直接影響員工打卡的距離驗證 (100m 範圍限制)。
設定公司專屬的打卡規則 (參見 FR-ADM-009)。
FR-ADM-003 員工管理：
新增、編輯、刪除公司內部員工。
為員工設定登入帳號、初始密碼。
為員工指定所屬部門、職位。
為員工分配特定的角色權限 (例如：是否為部門主管)。
查看員工列表、搜索員工。
FR-ADM-004 部門管理：
新增、編輯、刪除公司內部部門。
為部門指派部門主管。
查看部門列表、所屬員工。
FR-ADM-005 出勤記錄查詢與管理：
按日期範圍、員工姓名、部門篩選查詢所有出勤記錄。
顯示每次打卡的具體時間、地點 (可點擊查看地圖)。
自動標記異常出勤 (遲到、早退、未打卡)，並可手動修改異常狀態。
提供補卡申請審核功能 (員工可發起，管理員/主管審核)。
FR-ADM-006 加班申請審核：
列出所有待審核的加班申請。
顯示申請人、申請日期、時間、事由。
部門主管只能審核所屬部門員工的申請。
公司管理員可審核所有申請。
提供「批准」或「拒絕」選項，並可填寫審核意見。
審核結果自動通知申請員工。
可查看歷史加班申請及審核結果。
FR-ADM-007 請假申請審核：
功能與 FR-ADM-006 類似，針對請假申請。
可設定不同請假類型對應的審核流程。
FR-ADM-008 月度出勤報表：
按公司、部門、員工、日期範圍生成月度出勤總結報表。
報表內容包括：總工時、正常工時、加班時數、請假天數/時數、遲到次數、早退次數、曠工天數等。
提供報表匯出功能 (CSV, Excel, PDF)。
FR-ADM-009 考勤規則設定：
設定公司統一的上下班時間、午休時間。
設定允許打卡的地理範圍 (多個打卡點)。
設定遲到、早退的判斷標準和容忍時間。
設定法定假日、公司自定義假日。
設定加班的計算規則 (例如：平日加班、假日加班的倍數)。
FR-ADM-010 權限管理：
配置不同角色 (公司管理員、部門主管) 的功能操作權限。
部門主管只能查看和管理所屬部門的數據。
4. 非功能性需求 (Non-Functional Requirements)
NFR-001 性能：
打卡響應時間：< 2 秒。
報表生成時間：< 5 秒 (針對一個月內 500 名員工的數據)。
NFR-002 可用性：
介面簡潔、直觀，易於學習和使用。
PWA 在主流移動設備上提供良好的用戶體驗。
NFR-003 可擴展性：
系統架構應支援未來業務增長和用戶數量增加。
支援增加新的公司和員工數量，不影響現有性能。
NFR-004 安全性：
所有數據傳輸需採用 HTTPS 加密。
用戶密碼需加密存儲 (加鹽哈希)。
實施適當的訪問控制和權限管理。
防範常見的 Web 安全漏洞 (XSS, CSRF, SQL 注入等)。
NFR-005 兼容性：
PWA 支援 Chrome (Android), Safari (iOS), Firefox (Android) 等主流移動瀏覽器。
Web 後台管理系統支援 Chrome, Firefox, Edge 等主流桌面瀏覽器。
NFR-006 可維護性：
程式碼應模組化、可讀性高，易於後續維護和功能擴展。
NFR-007 數據備份與恢復：
數據庫應有定期的備份機制和恢復策略。
5. 技術選型與部署 (Technical Stack & Deployment)
5.1 前端 (PWA 員工端 & Web 後台)：
框架： React.js
UI 框架： shadcn/ui (基於 Radix UI 和 Tailwind CSS)
PWA 工具： Workbox (用於 Service Worker 管理)
打包工具： Vite / Webpack (根據項目初始化選擇)
部署： Firebase Hosting (無需 SSR)
5.2 後端：
語言與框架： Python (推薦使用 FastAPI 或 Django REST Framework)
API 規範： RESTful API
部署： Docker 容器化部署於自有的 VPS Server
5.3 數據庫：
類型： 關係型數據庫 (SQL)
推薦： PostgreSQL
5.4 開發輔助：
容器化 (開發環境)： Docker Compose
版本控制： Git
持續整合/持續部署 (CI/CD)： GitHub Actions / GitLab CI
6. 數據庫 Schema 設計 (PostgreSQL DDL)
6.1 公司與組織結構
6.1.1 companies 表 (公司信息)
儲存註冊系統的各公司基本信息。
code
SQL
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255), -- 公司地址 (已新增)
    latitude DECIMAL(10, 8), -- 公司緯度坐標 (已新增)
    longitude DECIMAL(11, 8), -- 公司經度坐標 (已新增)
    admin_user_id INTEGER, -- 關聯到第一個註冊的 admin 用戶
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    logo_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
6.1.2 departments 表 (部門信息)
儲存各公司的部門信息，並關聯到公司。
code
SQL
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    manager_id INTEGER, -- 關聯到 users 表，部門主管
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_department_name_per_company UNIQUE (company_id, name)
);
6.2 用戶與權限
6.2.1 users 表 (所有用戶，包括員工和管理員)
儲存所有登入系統的用戶信息。
code
SQL
CREATE TYPE user_role AS ENUM ('employee', 'department_head', 'company_admin');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE, -- 公司管理員可能沒有 company_id (系統級管理員，如果需要)
    username VARCHAR(255) UNIQUE NOT NULL, -- 用於登入
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- 密碼哈希值
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role user_role NOT NULL DEFAULT 'employee', -- 員工, 部門主管, 公司管理員
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL, -- 員工所屬部門
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 添加外鍵約束到 departments 表的 manager_id
ALTER TABLE departments
ADD CONSTRAINT fk_department_manager
FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- 更新 companies 表的 admin_user_id 外鍵
ALTER TABLE companies
ADD CONSTRAINT fk_company_admin
FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE SET NULL;
6.3 考勤與打卡
6.3.1 attendance_records 表 (打卡記錄)
儲存員工每次上下班的打卡記錄。
code
SQL
CREATE TYPE attendance_type AS ENUM ('check_in', 'check_out');
CREATE TYPE attendance_status AS ENUM ('normal', 'late', 'early_leave', 'missing_check_in', 'missing_check_out', 'out_of_range');

CREATE TABLE attendance_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    record_time TIMESTAMP WITH TIME ZONE NOT NULL, -- 打卡時間
    record_type attendance_type NOT NULL, -- check_in (上班), check_out (下班)
    latitude DECIMAL(10, 8), -- 打卡時的緯度
    longitude DECIMAL(11, 8), -- 打卡時的經度
    status attendance_status DEFAULT 'normal', -- 正常, 遲到, 早退, 漏打卡, 範圍外
    is_manual_correction BOOLEAN DEFAULT FALSE, -- 是否為手動修改的記錄
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 為快速查詢添加索引
CREATE INDEX idx_attendance_user_company_time ON attendance_records (user_id, company_id, record_time);
6.4 申請與審核
6.4.1 leave_types 表 (請假類型)
可配置的請假類型，如事假、病假、年假等。
code
SQL
CREATE TABLE leave_types (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_paid BOOLEAN DEFAULT TRUE, -- 是否帶薪
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_leave_type_name_per_company UNIQUE (company_id, name)
);
6.4.2 leave_applications 表 (請假申請)
儲存員工的請假申請。
code
SQL
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

CREATE TABLE leave_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT NOT NULL,
    status application_status DEFAULT 'pending',
    approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- 審核人
    approval_time TIMESTAMP WITH TIME ZONE,
    approval_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 為快速查詢添加索引
CREATE INDEX idx_leave_user_company_status ON leave_applications (user_id, company_id, status);
6.4.3 overtime_applications 表 (加班申請)
儲存員工的加班申請。
code
SQL
CREATE TABLE overtime_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    overtime_date DATE NOT NULL,
    start_time TIME WITH TIME ZONE NOT NULL,
    end_time TIME WITH TIME ZONE NOT NULL,
    reason TEXT NOT NULL,
    status application_status DEFAULT 'pending',
    approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approval_time TIMESTAMP WITH TIME ZONE,
    approval_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 為快速查詢添加索引
CREATE INDEX idx_overtime_user_company_status ON overtime_applications (user_id, company_id, status);
6.5 考勤規則 (公司級配置)
6.5.1 company_attendance_settings 表 (公司考勤設定)
儲存各公司的考勤規則，如上下班時間、打卡範圍等。
code
SQL
CREATE TABLE company_attendance_settings (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
    default_check_in_time TIME WITH TIME ZONE NOT NULL DEFAULT '09:00:00+08', -- 預設上班時間
    default_check_out_time TIME WITH TIME ZONE NOT NULL DEFAULT '18:00:00+08', -- 預設下班時間
    lunch_break_start TIME WITH TIME ZONE, -- 午休開始時間
    lunch_break_end TIME WITH TIME ZONE, -- 午休結束時間
    late_tolerance_minutes INTEGER DEFAULT 5, -- 遲到容忍分鐘數
    early_leave_tolerance_minutes INTEGER DEFAULT 5, -- 早退容忍分鐘數
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
6.5.2 punch_locations 表 (允許的打卡地點)
如果一個公司有多個允許打卡的辦公地點，可以在此設定。
code
SQL
CREATE TABLE punch_locations (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER NOT NULL, -- 允許打卡的半徑範圍 (米)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
6.5.3 holidays 表 (法定節假日及公司自定義節假日)
儲存公司的節假日列表，影響考勤計算。
code
SQL
CREATE TABLE holidays (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE, -- NULL 表示是通用法定假日
    name VARCHAR(255) NOT NULL,
    holiday_date DATE NOT NULL,
    is_full_day BOOLEAN DEFAULT TRUE, -- 是否為全天假日
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_holiday_per_company_date UNIQUE (company_id, holiday_date)
);
7. 地理位置打卡系統詳細設計 (Geolocation-Based Attendance System)

7.1 系統概述
本系統已成功實現基於 GPS 定位的智能打卡功能，確保員工必須在公司指定範圍內 (100 公尺) 才能完成打卡，有效防止遠程打卡和代打卡行為。

7.2 技術實現架構
✅ **前端位置獲取**：
- 使用 HTML5 Geolocation API 獲取用戶當前位置
- 設定 `enableHighAccuracy: true` 確保高精度定位
- 完整的錯誤處理：權限拒絕、位置無法獲取、超時等
- 用戶友好的狀態提示和錯誤訊息

✅ **後端距離驗證**：
- 使用 Haversine 公式精確計算兩個地理座標間的距離
- 實時驗證用戶位置與公司設定位置的距離
- 100 公尺範圍限制，超出範圍拒絕打卡
- 完整記錄打卡位置資訊 (緯度、經度、距離)

✅ **資料庫設計**：
- companies 表增加 latitude, longitude 欄位儲存公司位置
- attendance_records 表記錄每次打卡的完整地理位置資訊
- 支援多公司獨立的地理位置設定

7.3 地理位置打卡流程
1. **管理員設定公司位置**：
   - 在公司管理介面輸入經緯度坐標
   - 建議使用 Google Maps 獲取精確座標

2. **員工打卡流程**：
   - 點擊打卡按鈕 → 系統請求位置權限
   - 獲取高精度 GPS 位置 → 發送至後端驗證
   - 後端計算距離 → 驗證是否在允許範圍內
   - 打卡成功 → 顯示距離資訊和確認訊息

7.4 安全性與防護機制
✅ **防遠程打卡**：嚴格的 100m 距離限制
✅ **高精度定位**：requireHighAccuracy 確保位置準確性
✅ **後端最終驗證**：前端位置資訊由後端最終驗證，防止篡改
✅ **完整記錄**：所有打卡行為都記錄完整的地理位置資訊
✅ **錯誤處理**：完善的異常情況處理機制

7.5 技術規格
- **距離計算**：Haversine 公式，適用於地球表面距離計算
- **精度要求**：GPS 精度要求 ≤ 10 公尺
- **範圍限制**：公司位置 100 公尺範圍內
- **座標格式**：WGS84 坐標系統
- **資料類型**：DECIMAL(10,8) 緯度，DECIMAL(11,8) 經度

7.6 用戶體驗優化
✅ **即時反饋**：打卡後立即顯示距離公司的實際距離
✅ **狀態提示**：「正在取得位置資訊...」等進度提示
✅ **錯誤處理**：清楚的錯誤訊息，指導用戶解決問題
✅ **後退相容**：未設定地理位置的公司仍可正常使用

8. 開發階段與里程碑 (Development Phases & Milestones - 供初步參考)
階段 1: 核心後端 API 開發 (Python)
用戶與權限管理 (公司、員工、角色)
部門管理
考勤規則設定 API
打卡記錄存儲 API
加班/請假申請存儲 API
部署環境搭建 (Docker for VPS)
階段 2: PWA 員工端核心功能開發 (React + shadcn/ui)
登入/登出
上下班打卡 (包含 GPS)
個人出勤查詢
初步部署到 Firebase Hosting
階段 3: Web 後台管理系統核心功能開發 (React + shadcn/ui)
公司管理員登入
員工管理、部門管理
出勤記錄查詢
考勤規則配置
階段 4: 申請與審核流程開發
PWA 加班/請假申請
後台加班/請假審核
推播通知整合
階段 5: 報表與優化
月度出勤報表生成與匯出
PWA 離線功能優化
系統性能優化與安全性加固
階段 6: 測試與部署
全面測試、錯誤修復
部署到生產環境 (Firebase Hosting for Frontend, Docker on VPS for Backend)
# 企業智慧考勤管理系統 (Smart Attendance & Timesheet System) Constitution

## Core Principles

### I. 多租戶架構 (Multi-Tenant Architecture)
系統必須從頭開始設計，以支援多個公司，並實現嚴格的數據隔離。所有數據庫查詢和變更都必須限定在特定的 `company_id` 範圍內。

### II. API 驅動後端 (API-Driven Backend)
後端通過帶有版本控制的 RESTful API 來暴露所有功能。這是所有客戶端（PWA、Web 管理後台）的唯一合約。禁止客戶端直接訪問數據庫。

### III. 安全第一 (Security by Design)
所有開發工作都必須遵守 PRD 中定義的安全需求 (NFR-004)，包括但不限於：所有傳輸使用 HTTPS、密碼加鹽哈希、基於角色的訪問控制 (RBAC) 以及防範常見的 Web 漏洞。

### IV. PWA 優先 (PWA-First for Employees)
「員工」角色的主要介面是 PWA。針對此角色的功能開發必須優先考慮移動端體驗、PRD 中指定的離線能力和推播通知。

### V. 可測試與可維護性 (Testability & Maintainability)
程式碼必須模組化且可讀性高。關鍵業務邏輯，特別是後端（例如：考勤狀態計算、權限檢查），必須由單元測試或整合測試覆蓋。

## Development Workflow

所有功能的開發都必須始於一份遵循 `spec-template.md` 的規格文件。該規格文件必須經過審查，確認符合本憲法的所有原則後，才能進入實施階段。

## Governance

本憲法是專案開發的最高指導原則，其優先級高於任何個人的開發習慣或偏好。對本憲法的任何修訂都必須記錄在案，並通知所有專案參與者。

**Version**: 1.0 | **Ratified**: 2025-09-16 | **Last Amended**: 2025-09-16

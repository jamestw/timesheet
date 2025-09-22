#!/usr/bin/env python3
"""
數據庫遷移腳本 - 添加工作時間設定和請假功能
"""

import sqlite3
from datetime import datetime

def migrate_database():
    """執行數據庫遷移"""
    conn = sqlite3.connect('sql_app.db')
    cursor = conn.cursor()

    try:
        print("開始數據庫遷移...")

        # 1. 為companies表添加工作時間相關字段
        print("1. 為companies表添加工作時間設定字段...")

        # 檢查字段是否已存在
        cursor.execute("PRAGMA table_info(companies)")
        existing_columns = [column[1] for column in cursor.fetchall()]

        work_schedule_columns = [
            ('work_start_time', 'TIME DEFAULT "09:00:00"'),
            ('work_end_time', 'TIME DEFAULT "18:00:00"'),
            ('late_tolerance_minutes', 'INTEGER DEFAULT 5'),
            ('early_leave_tolerance_minutes', 'INTEGER DEFAULT 0')
        ]

        for column_name, column_def in work_schedule_columns:
            if column_name not in existing_columns:
                cursor.execute(f'ALTER TABLE companies ADD COLUMN {column_name} {column_def}')
                print(f"  [OK] 添加 {column_name} 字段")
            else:
                print(f"  [SKIP] {column_name} 字段已存在，跳過")

        # 2. 創建leave_applications表
        print("2. 創建leave_applications表...")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS leave_applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                company_id INTEGER NOT NULL,
                leave_type VARCHAR NOT NULL,
                start_date DATETIME NOT NULL,
                end_date DATETIME NOT NULL,
                reason TEXT NOT NULL,
                status VARCHAR DEFAULT 'pending',
                reviewed_by INTEGER,
                reviewed_at DATETIME,
                review_comment TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
            )
        """)
        print("  [OK] leave_applications表創建完成")

        # 3. 為現有公司設定默認工作時間（如果還沒設定的話）
        print("3. 為現有公司設定默認工作時間...")
        cursor.execute("""
            UPDATE companies
            SET work_start_time = '09:00:00',
                work_end_time = '18:00:00',
                late_tolerance_minutes = 5,
                early_leave_tolerance_minutes = 0
            WHERE work_start_time IS NULL OR work_end_time IS NULL
        """)
        affected_rows = cursor.rowcount
        if affected_rows > 0:
            print(f"  [OK] 為 {affected_rows} 家公司設定了默認工作時間")
        else:
            print("  [SKIP] 所有公司已有工作時間設定")

        conn.commit()
        print("數據庫遷移完成！")

    except Exception as e:
        print(f"遷移過程中發生錯誤: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

def verify_migration():
    """驗證遷移結果"""
    conn = sqlite3.connect('sql_app.db')
    cursor = conn.cursor()

    try:
        print("\n驗證遷移結果...")

        # 檢查companies表的新字段
        cursor.execute("PRAGMA table_info(companies)")
        companies_columns = [column[1] for column in cursor.fetchall()]

        required_work_schedule_columns = [
            'work_start_time', 'work_end_time',
            'late_tolerance_minutes', 'early_leave_tolerance_minutes'
        ]

        for column in required_work_schedule_columns:
            if column in companies_columns:
                print(f"  [OK] companies.{column} 存在")
            else:
                print(f"  [ERROR] companies.{column} 不存在")

        # 檢查leave_applications表
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='leave_applications'")
        if cursor.fetchone():
            print("  [OK] leave_applications表存在")

            # 檢查表結構
            cursor.execute("PRAGMA table_info(leave_applications)")
            leave_columns = [column[1] for column in cursor.fetchall()]
            print(f"  [OK] leave_applications表有 {len(leave_columns)} 個字段")
        else:
            print("  [ERROR] leave_applications表不存在")

        # 檢查現有公司的工作時間設定
        cursor.execute("SELECT COUNT(*) FROM companies WHERE work_start_time IS NOT NULL")
        companies_with_schedule = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM companies")
        total_companies = cursor.fetchone()[0]

        print(f"  [OK] {companies_with_schedule}/{total_companies} 家公司已設定工作時間")

    except Exception as e:
        print(f"驗證過程中發生錯誤: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
    verify_migration()
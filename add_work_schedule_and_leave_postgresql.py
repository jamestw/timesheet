#!/usr/bin/env python3
"""
PostgreSQL數據庫遷移腳本 - 添加工作時間設定和請假功能
"""

import psycopg2
from datetime import datetime
import os
from dotenv import load_dotenv

# 加載環境變量
load_dotenv()

def get_db_connection():
    """建立PostgreSQL連接"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST', '185.201.8.177'),
            database=os.getenv('POSTGRES_DB', 'timesheet'),
            user=os.getenv('POSTGRES_USER', 'apiuser'),
            password=os.getenv('POSTGRES_PASSWORD', 'Devo0932'),
            port=5432
        )
        return conn
    except Exception as e:
        print(f"資料庫連接失敗: {e}")
        return None

def migrate_database():
    """執行數據庫遷移"""
    conn = get_db_connection()
    if not conn:
        return False

    cursor = conn.cursor()

    try:
        print("開始PostgreSQL數據庫遷移...")

        # 1. 為companies表添加工作時間相關字段
        print("1. 為companies表添加工作時間設定字段...")

        # 檢查字段是否已存在
        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'companies'
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]

        work_schedule_columns = [
            ('work_start_time', 'TIME DEFAULT \'09:00:00\''),
            ('work_end_time', 'TIME DEFAULT \'18:00:00\''),
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

        # 檢查表是否已存在
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'leave_applications'
            )
        """)
        table_exists = cursor.fetchone()[0]

        if not table_exists:
            cursor.execute("""
                CREATE TABLE leave_applications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    company_id INTEGER NOT NULL,
                    leave_type VARCHAR NOT NULL,
                    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
                    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
                    reason TEXT NOT NULL,
                    status VARCHAR DEFAULT 'pending',
                    reviewed_by INTEGER,
                    reviewed_at TIMESTAMP WITH TIME ZONE,
                    review_comment TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
                )
            """)
            print("  [OK] leave_applications表創建完成")
        else:
            print("  [SKIP] leave_applications表已存在")

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
        print("PostgreSQL數據庫遷移完成！")
        return True

    except Exception as e:
        print(f"遷移過程中發生錯誤: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def verify_migration():
    """驗證遷移結果"""
    conn = get_db_connection()
    if not conn:
        return

    cursor = conn.cursor()

    try:
        print("\n驗證遷移結果...")

        # 檢查companies表的新字段
        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'companies'
        """)
        companies_columns = [row[0] for row in cursor.fetchall()]

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
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'leave_applications'
            )
        """)
        if cursor.fetchone()[0]:
            print("  [OK] leave_applications表存在")

            # 檢查表結構
            cursor.execute("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'leave_applications'
            """)
            leave_columns = [row[0] for row in cursor.fetchall()]
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
        cursor.close()
        conn.close()

if __name__ == "__main__":
    success = migrate_database()
    if success:
        verify_migration()
    else:
        print("遷移失敗，請檢查資料庫連接和權限設定")
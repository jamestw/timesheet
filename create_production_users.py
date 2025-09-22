#!/usr/bin/env python3
"""
建立正式機測試用戶
"""
import sys
import os
from sqlalchemy.orm import Session

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.db.base import SessionLocal
from app.db.models import Company, User, UserRole
from app.core.security import get_password_hash

def create_production_users():
    db: Session = SessionLocal()
    try:
        print("🚀 建立正式機測試用戶...")

        # 確保有預設公司
        company = db.query(Company).filter(Company.id == 1).first()
        if not company:
            company = Company(id=1, name="測試公司", address="台北市信義區", location_lat=25.033, location_lng=121.565, location_radius=100)
            db.add(company)
            db.commit()
            db.refresh(company)
            print(f"✅ 建立預設公司: {company.name}")

        # 建立測試用戶
        test_users = [
            {
                "email": "user@example.com",
                "password": "password123",
                "role": UserRole.employee,
                "first_name": "測試",
                "last_name": "員工"
            },
            {
                "email": "admin@example.com",
                "password": "admin123",
                "role": UserRole.company_admin,
                "first_name": "公司",
                "last_name": "管理員"
            },
            {
                "email": "super@example.com",
                "password": "super123",
                "role": UserRole.super_admin,
                "first_name": "超級",
                "last_name": "管理員"
            },
            {
                "email": "companyadmin@example.com",
                "password": "password123",
                "role": UserRole.company_admin,
                "first_name": "公司管理員",
                "last_name": "2"
            }
        ]

        for user_data in test_users:
            # 刪除如果已存在
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            if existing_user:
                db.delete(existing_user)
                db.commit()
                print(f"🗑️ 刪除現有用戶: {user_data['email']}")

            # 建立新用戶
            hashed_password = get_password_hash(user_data["password"])
            new_user = User(
                username=user_data["email"],
                email=user_data["email"],
                hashed_password=hashed_password,
                role=user_data["role"],
                company_id=company.id,
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                is_active=True
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            print(f"✅ 建立用戶: {new_user.email} ({user_data['role'].value})")

        print("\n🎉 所有測試用戶建立完成！")
        print("\n📝 登入資訊:")
        print("  👤 一般員工: user@example.com / password123")
        print("  👤 公司管理員: admin@example.com / admin123")
        print("  👤 公司管理員2: companyadmin@example.com / password123")
        print("  👤 超級管理員: super@example.com / super123")

    except Exception as e:
        db.rollback()
        print(f"❌ 錯誤: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_production_users()
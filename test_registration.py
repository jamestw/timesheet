#!/usr/bin/env python3
"""
Test the registration API with company tax ID
"""
import requests
import json

def test_registration():
    url = "http://localhost:8001/api/v1/register"

    # Test data using an existing company tax_id
    test_user = {
        "username": "testuser_123456",  # Will be auto-generated anyway
        "email": "test@example.com",
        "password": "testpass123",
        "first_name": "測試",
        "last_name": "用戶",
        "phone": "0912345678",
        "gender": "female",
        "birth_date": "1990-01-01",
        "address": "台北市信義區",
        "emergency_contact_name": "緊急聯絡人",
        "emergency_contact_phone": "0987654321",
        "id_number": "A123456789",
        "employee_number": "EMP001",
        "company_tax_id": "12345670"  # Using existing company tax ID
    }

    print("Testing registration with company tax ID:", test_user["company_tax_id"])
    print("Testing with user:", test_user["email"])

    try:
        response = requests.post(url, json=test_user)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        if response.status_code == 200:
            print("✅ Registration successful!")
        else:
            print("❌ Registration failed!")

    except Exception as e:
        print(f"Error occurred: {e}")

def test_invalid_tax_id():
    url = "http://localhost:8001/api/v1/register"

    # Test data with invalid tax_id
    test_user = {
        "username": "testuser2_123456",
        "email": "test2@example.com",
        "password": "testpass123",
        "first_name": "測試2",
        "last_name": "用戶2",
        "company_tax_id": "99999999"  # Invalid tax ID
    }

    print("\nTesting registration with INVALID tax ID:", test_user["company_tax_id"])

    try:
        response = requests.post(url, json=test_user)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        if response.status_code == 400:
            print("✅ Correctly rejected invalid tax ID!")
        else:
            print("❌ Should have rejected invalid tax ID!")

    except Exception as e:
        print(f"Error occurred: {e}")

if __name__ == "__main__":
    test_registration()
    test_invalid_tax_id()
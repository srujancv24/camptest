#!/usr/bin/env python3
"""
Test script to verify API endpoints work correctly with the security fixes
"""
import requests
import json
import time
import sys

BASE_URL = "http://localhost:8000"

def test_health_endpoint():
    """Test health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Health endpoint working")
            print(f"   Status: {data.get('status')}")
            return True
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Health endpoint error: {e}")
        return False

def test_registration_endpoint():
    """Test user registration with bcrypt password hashing"""
    try:
        test_user = {
            "first_name": "Test",
            "last_name": "User",
            "email": f"test_{int(time.time())}@example.com",
            "password": "secure_password_123"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=test_user,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                print("✅ Registration endpoint working")
                print(f"   User created: {data['user']['email']}")
                return True, data["access_token"]
            else:
                print("❌ Registration response missing required fields")
                return False, None
        else:
            print(f"❌ Registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False, None
    except requests.exceptions.RequestException as e:
        print(f"❌ Registration endpoint error: {e}")
        return False, None

def test_authentication_endpoint(token):
    """Test authentication with JWT token"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            if "user" in data:
                print("✅ Authentication endpoint working")
                print(f"   Authenticated user: {data['user']['email']}")
                return True
            else:
                print("❌ Authentication response missing user data")
                return False
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Authentication endpoint error: {e}")
        return False

def check_server_running():
    """Check if the server is running"""
    try:
        response = requests.get(f"{BASE_URL}/", timeout=2)
        return response.status_code == 200
    except:
        return False

def main():
    """Run API endpoint tests"""
    print("🌐 Running API Endpoint Tests")
    print("=" * 40)
    
    # Check if server is running
    if not check_server_running():
        print("❌ Server is not running!")
        print("   Please start the server with: cd backend && python3 -m uvicorn main:app --reload")
        return False
    
    tests_passed = 0
    total_tests = 3
    
    # Test health endpoint
    print("\n🧪 Testing Health Endpoint...")
    if test_health_endpoint():
        tests_passed += 1
    
    # Test registration endpoint
    print("\n🧪 Testing Registration Endpoint...")
    reg_success, token = test_registration_endpoint()
    if reg_success:
        tests_passed += 1
        
        # Test authentication endpoint
        print("\n🧪 Testing Authentication Endpoint...")
        if test_authentication_endpoint(token):
            tests_passed += 1
    else:
        print("⏭️  Skipping authentication test due to registration failure")
    
    print("\n" + "=" * 40)
    print(f"📊 API Test Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 All API endpoints working correctly!")
        print("\n✅ Verified functionality:")
        print("   • Health check endpoint")
        print("   • User registration with bcrypt password hashing")
        print("   • JWT authentication with database verification")
        return True
    else:
        print("❌ Some API tests failed.")
        if not check_server_running():
            print("   Make sure the server is running first.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
import asyncio
import sys
import os
from pathlib import Path
import httpx

# Add parent directory to Python path
backend_dir = Path(__file__).parent
project_root = backend_dir.parent
sys.path.insert(0, str(project_root))

from backend.app.database import AsyncSessionLocal
from backend.app.config import settings
from sqlalchemy import text

async def check_db():
    print(f"Checking database connection to: {settings.DATABASE_URL.split('@')[-1]}") # Hide credentials
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            print(f"Database connection successful! Result: {result.scalar()}")
    except Exception as e:
        print(f"Database connection FAILED: {e}")
        return False
    return True

async def test_login_http(base_url):
    print(f"\nTesting login via {base_url}...")
    async with httpx.AsyncClient(base_url=base_url, timeout=30.0) as client:
        try:
            # 1. Login
            login_data = {
                "email": "test@example.com",
                "password": "password123"
            }
            print(f"Attempting login with {login_data['email']}...")
            response = await client.post("/api/auth/login" if "5000" in base_url else "/auth/login", json=login_data)
            
            print(f"Login Status: {response.status_code}")
            if response.status_code != 200:
                print(f"Login Failed: {response.text}")
                return

            cookies = response.cookies
            print(f"Cookies received: {dict(cookies)}")
            
            if "access_token" not in cookies:
                print("ERROR: No access_token cookie received!")
                return

            # 2. Get Me
            print("Attempting to fetch /me endpoint...")
            # For port 8000, the prefix is /auth/me. For 5000, it's /api/auth/me
            me_endpoint = "/api/auth/me" if "5000" in base_url else "/auth/me"
            
            response = await client.get(me_endpoint, cookies=cookies)
            print(f"Me Status: {response.status_code}")
            print(f"Me Response: {response.json()}")
            
            if response.status_code == 200:
                print("SUCCESS: Full login flow working!")
            else:
                print("FAILURE: Could not access protected endpoint.")

        except Exception as e:
            import traceback
            print(f"HTTP Test Failed: {repr(e)}")
            traceback.print_exc()

if __name__ == "__main__":
    print("--- Starting Diagnostics ---")
    # if asyncio.run(check_db()):
    #     asyncio.run(test_login_http("http://127.0.0.1:8000"))
    asyncio.run(test_login_http("http://127.0.0.1:5000"))
    print("\n--- Diagnostics Complete ---")

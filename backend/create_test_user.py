#!/usr/bin/env python3
"""
Create a test user for login testing
Run with: python backend/create_test_user.py
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to Python path
backend_dir = Path(__file__).parent
project_root = backend_dir.parent
sys.path.insert(0, str(project_root))

from backend.app.database import AsyncSessionLocal
from backend.app.models import User
from backend.app.security import get_password_hash
import uuid


async def create_test_user():
    """Create a test user"""
    email = "test@example.com"
    password = "password123"
    
    async with AsyncSessionLocal() as db:
        # Check if user already exists
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.email == email))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print(f"Test user already exists: {email}")
            print(f"Password: {password}")
            return
        
        # Create test user
        hashed_password = get_password_hash(password)
        new_user = User(
            id=str(uuid.uuid4()),
            email=email,
            password_hash=hashed_password,
            first_name="Test",
            last_name="User",
            role="customer",
            subscription_tier="free",
        )
        
        db.add(new_user)
        await db.commit()
        
        print("[OK] Test user created successfully!")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print("\nYou can now login with these credentials.")


if __name__ == "__main__":
    asyncio.run(create_test_user())


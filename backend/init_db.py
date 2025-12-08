#!/usr/bin/env python3
"""
Initialize database - Create all tables
Run with: python backend/init_db.py
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to Python path
backend_dir = Path(__file__).parent
project_root = backend_dir.parent
sys.path.insert(0, str(project_root))

from backend.app.database import engine, Base
from backend.app.models import (
    User, Loan, RepoRate, BankRate, Notification, 
    NegotiationRequest, Prepayment, SavingsReport, ChatSession
)


async def init_database():
    """Create all database tables"""
    print("Creating database tables...")
    
    async with engine.begin() as conn:
        # Drop all tables (for clean start)
        await conn.run_sync(Base.metadata.drop_all)
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    
    print("[OK] Database tables created successfully!")
    print("Tables created: User, Loan, RepoRate, BankRate, Notification,")
    print("               NegotiationRequest, Prepayment, SavingsReport, ChatSession")


if __name__ == "__main__":
    asyncio.run(init_database())


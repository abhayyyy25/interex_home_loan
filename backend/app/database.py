"""Database configuration and session management - AIVEN POSTGRESQL OPTIMIZED"""
import os
import ssl
import asyncio
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from dotenv import load_dotenv
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode
from fastapi import HTTPException
from sqlalchemy import text

load_dotenv()

# Load from .env
DATABASE_URL = os.getenv("DATABASE_URL", "")

print(f"[DB] Loading database configuration...")
print(f"[DB] Database URL: {DATABASE_URL}")

# SQLITE — for fallback only
if DATABASE_URL.startswith("sqlite"):
    print("[DB] Using SQLite for local development")
    async_url = DATABASE_URL
    engine_config = {
        "echo": False,
        "future": True,
        "connect_args": {"check_same_thread": False},
        "pool_pre_ping": True,
    }

else:
    print("[DB] Using PostgreSQL (Aiven)")

    # Convert postgres:// → postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        print("[DB] Converted postgres:// to postgresql://")

    # Parse URL
    parsed = urlparse(DATABASE_URL)
    query = parse_qs(parsed.query)

    # Remove sslmode from query (asyncpg will break otherwise)
    ssl_mode = query.pop("sslmode", ["require"])[0]
    print(f"[DB] SSL Mode = {ssl_mode}")

    clean_query = urlencode(query, doseq=True)

    clean_url = urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        parsed.params,
        clean_query,
        parsed.fragment
    ))

    # Convert to asyncpg
    async_url = clean_url.replace("postgresql://", "postgresql+asyncpg://")

    print(f"[DB] Final async URL = {async_url}")

    # CRITICAL SSL FIX — REAL SSL Context
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    print("[DB] SSL Context configured: verify_mode=CERT_NONE")

    # Engine config
    engine_config = {
        "echo": False,
        "future": True,
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 5,
        "pool_recycle": 1800,
        "pool_timeout": 5,
        "connect_args": {
            "ssl": ssl_context,
            "timeout": 10,
            "command_timeout": 30,
            "server_settings": {
                "application_name": "interex_app",
                "jit": "off",
            }
        }
    }

# CREATE ENGINE
print("[DB] Creating async engine…")
engine = create_async_engine(async_url, **engine_config)
print("[DB] Engine created successfully")

# SESSION FACTORY
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base Model
Base = declarative_base()

# Dependency
async def get_db():
    session = AsyncSessionLocal()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()
        print("[DB] Session closed")

# Test connection
async def test_connection():
    print("[DB] Testing DB connection…")
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            print("[DB] Connection OK")
            return True
    except Exception as e:
        print(f"[DB] Connection FAILED: {e}")
        return False

print("[DB] Database configuration loaded successfully")

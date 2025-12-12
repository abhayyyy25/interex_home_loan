"""FastAPI main application entry point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import Base, engine

import asyncio
from .services.market_simulator import run_market_simulator

# API prefix for all routes
# API_PREFIX = "/api"

# Create FastAPI app
# CRITICAL: redirect_slashes=False prevents 307 redirects that drop auth cookies
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    debug=settings.DEBUG,
    redirect_slashes=False,
)

# CORS middleware - Allow frontend to make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    loop = asyncio.get_event_loop()
    loop.create_task(run_market_simulator())
    print("[STARTUP] Market Simulator Running...")

@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "running",
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}


# Import Routers
from .api.v1 import (
    auth,
    loans,
    calculator,
    negotiations,
    notifications,
    admin,
    chat,
    reports,
    rates,
)

# API prefix - works for both localhost (via proxy) and Render (direct calls)
API_PREFIX = "/api"

app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["Authentication"])
app.include_router(loans.router, prefix=f"{API_PREFIX}/loans", tags=["Loans"])
app.include_router(calculator.router, prefix=f"{API_PREFIX}/calculator", tags=["Calculator"])
app.include_router(negotiations.router, prefix=f"{API_PREFIX}/negotiations", tags=["Negotiations"])
app.include_router(notifications.router, prefix=f"{API_PREFIX}/notifications", tags=["Notifications"])
app.include_router(admin.router, prefix=f"{API_PREFIX}/admin", tags=["Admin"])
app.include_router(chat.router, prefix=f"{API_PREFIX}/chat", tags=["Chat"])
app.include_router(reports.router, prefix=f"{API_PREFIX}/reports", tags=["Reports"])
app.include_router(rates.router, prefix=f"{API_PREFIX}/rates", tags=["Rates"])

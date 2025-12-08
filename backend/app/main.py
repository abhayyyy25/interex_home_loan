"""FastAPI main application entry point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import Base, engine

import asyncio                                       # ✅ ADD
from .services.market_simulator import run_market_simulator   # ✅ ADD

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    debug=settings.DEBUG,
)

# CORS middleware - Allow frontend to make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://localhost:5173",
        "http://127.0.0.1:5000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.on_event("startup")
async def startup():
    """Startup tasks"""
    
    # 🔥 Start Market Simulator (Runs forever in background)
    loop = asyncio.get_event_loop()
    loop.create_task(run_market_simulator())

    print("🔥 Market Simulator Running...")

@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

# Import and register API routers
from .api.v1 import auth, loans, calculator, negotiations, notifications, admin, chat, reports, rates

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(loans.router, prefix="/loans", tags=["Loans"])
app.include_router(calculator.router, prefix="/calculator", tags=["Calculator"])
app.include_router(negotiations.router, prefix="/negotiations", tags=["Negotiations"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(rates.router, prefix="/rates", tags=["Rates"])

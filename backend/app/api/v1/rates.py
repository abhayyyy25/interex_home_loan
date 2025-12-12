"""Rate Monitoring API endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel

from ...database import get_db
from ...models import User, Loan, RepoRate, BankRate
from .auth import get_current_user

router = APIRouter()


class RepoRateResponse(BaseModel):
    id: int
    rate: float
    effective_date: str
    change_bps: Optional[int]
    announcement_date: Optional[str]

    class Config:
        from_attributes = True


class BankRateResponse(BaseModel):
    id: int
    bank_name: str
    interest_rate: float
    loan_amount_min: Optional[float]
    loan_amount_max: Optional[float]
    processing_fee: Optional[float]
    prepayment_allowed: bool
    prepayment_charges: Optional[str]
    last_updated: str

    class Config:
        from_attributes = True


class RateComparisonResponse(BaseModel):
    loan_id: int
    user_loan_rate: float
    current_market_avg: float
    best_available_rate: float
    potential_annual_savings: float
    banks_below_user_rate: List[BankRateResponse]


@router.get("/repo/current/")
async def get_current_repo_rate(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the current RBI repo rate"""
    
    result = await db.execute(
        select(RepoRate)
        .order_by(desc(RepoRate.effective_date))
        .limit(1)
    )
    current_rate = result.scalar_one_or_none()
    
    if not current_rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No repo rate data available"
        )
    
    return {
        "id": current_rate.id,
        "rate": current_rate.rate,
        "effective_date": current_rate.effective_date.isoformat(),
        "change_bps": current_rate.change_bps,
        "announcement_date": current_rate.announcement_date.isoformat() if current_rate.announcement_date else None
    }


@router.get("/repo/history/")
async def get_repo_rate_history(
    limit: int = Query(12, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get historical RBI repo rates"""
    
    result = await db.execute(
        select(RepoRate)
        .order_by(desc(RepoRate.effective_date))
        .limit(limit)
    )
    rates = result.scalars().all()
    
    return {
        "rates": [
            {
                "id": rate.id,
                "rate": rate.rate,
                "effective_date": rate.effective_date.isoformat(),
                "change_bps": rate.change_bps,
                "announcement_date": rate.announcement_date.isoformat() if rate.announcement_date else None
            }
            for rate in rates
        ]
    }


@router.get("/banks/current/")
async def get_current_bank_rates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get bank home loan rates — fallback to user's loan rates if empty"""

    # Try getting BankRate table data
    result = await db.execute(select(BankRate))
    bank_rates = result.scalars().all()

    # ⭕ FALLBACK TO USER LOANS IF BANK RATES EMPTY
    if not bank_rates:
        loan_result = await db.execute(
            select(Loan).where(Loan.user_id == current_user.id)
        )
        user_loans = loan_result.scalars().all()

        return {
            "rates": [
                {
                    "id": loan.id,
                    "bank_name": loan.bank_name,
                    "interest_rate": loan.interest_rate,
                    "loan_amount_min": None,
                    "loan_amount_max": None,
                    "processing_fee": None,
                    "prepayment_allowed": True,
                    "prepayment_charges": None,
                    "last_updated": loan.start_date,
                }
                for loan in user_loans
            ]
        }

    # If BankRate table has data → Return actual market data
    return {
        "rates": [
            {
                "id": rate.id,
                "bank_name": rate.bank_name,
                "interest_rate": rate.interest_rate,
                "loan_amount_min": rate.loan_amount_min,
                "loan_amount_max": rate.loan_amount_max,
                "processing_fee": rate.processing_fee,
                "prepayment_allowed": rate.prepayment_allowed,
                "prepayment_charges": rate.prepayment_charges,
                "last_updated": rate.last_updated.isoformat(),
            }
            for rate in bank_rates
        ]
    }


@router.get("/comparison/")
async def get_rate_comparison(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Compare loan rate with market or fallback to user's other loans"""

    # Get all user's loans
    loan_result = await db.execute(
        select(Loan).where(
            and_(Loan.user_id == current_user.id, Loan.is_active == True)
        )
    )
    user_loans = loan_result.scalars().all()

    if not user_loans:
        raise HTTPException(404, "No loans found")

    # Compare first loan only
    user_loan = user_loans[0]

    # Try getting market bank rates
    result = await db.execute(select(BankRate))
    market_rates = result.scalars().all()

    # ⭕ FALLBACK: Use user loans as market data
    if not market_rates:
        market_rates = user_loans

    # Compute stats
    avg_rate = sum(l.interest_rate for l in market_rates) / len(market_rates)
    best_rate = min(l.interest_rate for l in market_rates)
    rate_diff = user_loan.interest_rate - best_rate
    potential_annual_savings = (user_loan.outstanding_principal * rate_diff / 100)

    return {
        "loan_id": user_loan.id,
        "user_loan_rate": user_loan.interest_rate,
        "current_market_avg": round(avg_rate, 2),
        "best_available_rate": best_rate,
        "potential_annual_savings": round(potential_annual_savings, 2),
        "banks_below_user_rate": [
            {
                "id": l.id,
                "bank_name": l.bank_name,
                "interest_rate": l.interest_rate,
                "processing_fee": None,
                "last_updated": l.start_date,
            }
            for l in market_rates
            if l.interest_rate < user_loan.interest_rate
        ],
    }


@router.get("/trends/")
async def get_rate_trends(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns live trend data if available.
    If empty → fallback to user-loan-based synthetic trend.
    """

    # ----------------------------
    # 1) TRY FETCHING LIVE REPO RATE TREND
    # ----------------------------
    repo_result = await db.execute(
        select(RepoRate).order_by(RepoRate.effective_date)
    )
    repo_rates = repo_result.scalars().all()

    # ----------------------------
    # 2) TRY FETCHING LIVE BANK RATE TRENDS
    # ----------------------------
    major_banks = ["SBI", "HDFC", "ICICI", "Axis Bank", "PNB"]
    bank_trends = {}

    for bank in major_banks:
        bank_result = await db.execute(
            select(BankRate)
            .where(BankRate.bank_name.ilike(f"%{bank}%"))
            .order_by(BankRate.last_updated)
        )
        rows = bank_result.scalars().all()
        if rows:
            bank_trends[bank] = [
                {
                    "date": r.last_updated.isoformat(),
                    "rate": r.interest_rate
                }
                for r in rows
            ]

    # ----------------------------
    # CASE A — If LIVE DATA EXISTS → return it
    # ----------------------------
    if repo_rates or bank_trends:
        return {
            "repo_rate_trend": [
                {
                    "date": r.effective_date.isoformat(),
                    "rate": r.rate,
                    "change_bps": r.change_bps
                }
                for r in repo_rates
            ],
            "bank_rate_trends": bank_trends,
            "fallback_used": False
        }

    # ----------------------------
    # CASE B — FALLBACK TO USER LOAN HISTORY
    # ----------------------------
    user_result = await db.execute(
        select(Loan)
        .where(Loan.user_id == current_user.id)
        .order_by(Loan.created_at)
    )
    loans = user_result.scalars().all()

    return {
        "repo_rate_trend": [
            {
                "date": l.created_at.isoformat(),
                "rate": l.interest_rate
            }
            for l in loans
        ],
        "bank_rate_trends": {},  # No bank trends in fallback
        "fallback_used": True
    }

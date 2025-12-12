"""Reports API endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from typing import Optional
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

from ...database import get_db
from ...models import User, Loan, Prepayment, SavingsReport
from ...services.report_service import ReportService
from .auth import get_current_user

router = APIRouter()  # ❌ NO prefix here


@router.get("/generate/")
async def generate_report(
    report_type: str = Query(..., regex="^(monthly|annual)$"),
    period: Optional[str] = Query(None, description="Format: YYYY-MM for monthly, YYYY for annual"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a savings report for the user"""
    
    # Default to current period if not specified
    if not period:
        now = datetime.now()
        if report_type == "monthly":
            period = now.strftime("%Y-%m")
        else:
            period = now.strftime("%Y")
    
    # Validate period format
    if report_type == "monthly" and len(period) != 7:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Monthly period must be in format YYYY-MM"
        )
    elif report_type == "annual" and len(period) != 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Annual period must be in format YYYY"
        )
    
    # Check if report already exists
    result = await db.execute(
        select(SavingsReport)
        .where(
            and_(
                SavingsReport.user_id == current_user.id,
                SavingsReport.report_type == report_type,
                SavingsReport.period == period
            )
        )
    )
    existing_report = result.scalar_one_or_none()
    
    if existing_report:
        # Return existing report
        return {
            "id": existing_report.id,
            "report_type": existing_report.report_type,
            "period": existing_report.period,
            "total_prepayments": existing_report.total_prepayments,
            "total_interest_saved": existing_report.total_interest_saved,
            "total_tenure_reduced_months": existing_report.total_tenure_reduced_months,
            "ai_narrative": existing_report.ai_narrative,
            "report_data": existing_report.report_data,
            "generated_at": existing_report.generated_at.isoformat() if existing_report.generated_at else None
        }
    
    # Generate new report
    report_service = ReportService(db)
    report = await report_service.generate_report(current_user.id, report_type, period)
    
    return {
        "id": report.id,
        "report_type": report.report_type,
        "period": report.period,
        "total_prepayments": report.total_prepayments,
        "total_interest_saved": report.total_interest_saved,
        "total_tenure_reduced_months": report.total_tenure_reduced_months,
        "ai_narrative": report.ai_narrative,
        "report_data": report.report_data,
        "generated_at": report.generated_at.isoformat() if report.generated_at else None
    }


@router.get("/list/")
async def list_reports(
    report_type: Optional[str] = Query(None, regex="^(monthly|annual)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all reports for the user"""
    
    query = select(SavingsReport).where(SavingsReport.user_id == current_user.id)
    
    if report_type:
        query = query.where(SavingsReport.report_type == report_type)
    
    query = query.order_by(SavingsReport.period.desc())
    
    result = await db.execute(query)
    reports = result.scalars().all()
    
    return [
        {
            "id": report.id,
            "report_type": report.report_type,
            "period": report.period,
            "total_prepayments": report.total_prepayments,
            "total_interest_saved": report.total_interest_saved,
            "total_tenure_reduced_months": report.total_tenure_reduced_months,
            "generated_at": report.generated_at.isoformat() if report.generated_at else None
        }
        for report in reports
    ]


@router.get("/summary/")
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get overall savings summary across all loans"""
    
    report_service = ReportService(db)
    summary = await report_service.get_overall_summary(current_user.id)
    
    return summary

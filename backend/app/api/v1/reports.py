"""Reports API endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from typing import Optional
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

from ...database import get_db
from ...models import User, Loan, Prepayment, SavingsReport, NegotiationRequest, NegotiationStatus, UserRole
from ...services.report_service import ReportService
from .auth import get_current_user
from ...security import require_admin

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


# ===============================================
# ADMIN PLATFORM REPORTS ENDPOINT
# ===============================================

@router.get("/admin/platform/")
async def get_admin_platform_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin endpoint for platform-wide analytics and reports.
    Returns aggregated data across ALL users.
    """
    
    # 1. Total AUM (Assets Under Management) - Sum of all outstanding principals
    aum_result = await db.execute(
        select(func.sum(Loan.outstanding_principal))
        .where(Loan.is_active == True)
    )
    total_aum = aum_result.scalar() or 0
    
    # 2. Total Loan Amount across platform
    total_loan_result = await db.execute(
        select(func.sum(Loan.loan_amount))
        .where(Loan.is_active == True)
    )
    total_loan_amount = total_loan_result.scalar() or 0
    
    # 3. Platform-wide Interest Saved from prepayments
    prepayment_savings_result = await db.execute(
        select(func.sum(Prepayment.interest_saved))
    )
    prepayment_interest_saved = prepayment_savings_result.scalar() or 0
    
    # 4. Interest saved from approved negotiations (estimated)
    approved_negotiations = await db.execute(
        select(NegotiationRequest)
        .where(NegotiationRequest.status == NegotiationStatus.APPROVED)
    )
    negotiations_list = approved_negotiations.scalars().all()
    
    negotiation_interest_saved = 0.0
    for neg in negotiations_list:
        if neg.current_rate and neg.target_rate:
            rate_reduction = float(neg.current_rate) - float(neg.target_rate)
            if rate_reduction > 0:
                # Get the loan to calculate savings
                loan_result = await db.execute(
                    select(Loan).where(Loan.id == neg.loan_id)
                )
                loan = loan_result.scalar_one_or_none()
                if loan:
                    # Estimate annual savings
                    annual_savings = float(loan.loan_amount) * (rate_reduction / 100.0)
                    negotiation_interest_saved += annual_savings
    
    total_interest_saved = float(prepayment_interest_saved) + negotiation_interest_saved
    
    # 5. Average Loan Rate across all active loans
    avg_rate_result = await db.execute(
        select(func.avg(Loan.interest_rate))
        .where(Loan.is_active == True)
    )
    avg_loan_rate = avg_rate_result.scalar() or 0
    
    # 6. Loan Distribution by Bank
    bank_distribution_result = await db.execute(
        select(
            Loan.bank_name,
            func.sum(Loan.outstanding_principal).label("total_outstanding"),
            func.count(Loan.id).label("loan_count")
        )
        .where(Loan.is_active == True)
        .group_by(Loan.bank_name)
        .order_by(func.sum(Loan.outstanding_principal).desc())
    )
    bank_distribution = [
        {
            "bank_name": row.bank_name,
            "total_outstanding": float(row.total_outstanding or 0),
            "loan_count": row.loan_count
        }
        for row in bank_distribution_result
    ]
    
    # 7. Negotiation Performance Stats
    total_negotiations_result = await db.execute(
        select(func.count(NegotiationRequest.id))
        .where(NegotiationRequest.status.in_([NegotiationStatus.APPROVED, NegotiationStatus.REJECTED]))
    )
    total_processed = total_negotiations_result.scalar() or 0
    
    approved_count_result = await db.execute(
        select(func.count(NegotiationRequest.id))
        .where(NegotiationRequest.status == NegotiationStatus.APPROVED)
    )
    approved_count = approved_count_result.scalar() or 0
    
    rejected_count_result = await db.execute(
        select(func.count(NegotiationRequest.id))
        .where(NegotiationRequest.status == NegotiationStatus.REJECTED)
    )
    rejected_count = rejected_count_result.scalar() or 0
    
    pending_count_result = await db.execute(
        select(func.count(NegotiationRequest.id))
        .where(NegotiationRequest.status == NegotiationStatus.PENDING)
    )
    pending_count = pending_count_result.scalar() or 0
    
    success_rate = (approved_count / total_processed * 100) if total_processed > 0 else 0
    
    # 8. Average Rate Reduction in successful negotiations
    avg_rate_reduction = 0.0
    if len(negotiations_list) > 0:
        total_reduction = sum(
            float(n.current_rate) - float(n.target_rate)
            for n in negotiations_list
            if n.current_rate and n.target_rate
        )
        avg_rate_reduction = total_reduction / len(negotiations_list)
    
    # 9. Active loans count
    active_loans_result = await db.execute(
        select(func.count(Loan.id))
        .where(Loan.is_active == True)
    )
    active_loans_count = active_loans_result.scalar() or 0
    
    # 10. Total users with loans
    users_with_loans_result = await db.execute(
        select(func.count(func.distinct(Loan.user_id)))
        .where(Loan.is_active == True)
    )
    users_with_loans = users_with_loans_result.scalar() or 0
    
    return {
        "kpis": {
            "total_aum": round(float(total_aum), 2),
            "total_loan_amount": round(float(total_loan_amount), 2),
            "total_interest_saved": round(total_interest_saved, 2),
            "prepayment_interest_saved": round(float(prepayment_interest_saved), 2),
            "negotiation_interest_saved": round(negotiation_interest_saved, 2),
            "avg_loan_rate": round(float(avg_loan_rate), 2),
            "active_loans": active_loans_count,
            "users_with_loans": users_with_loans,
        },
        "bank_distribution": bank_distribution,
        "negotiation_performance": {
            "total_processed": total_processed,
            "approved": approved_count,
            "rejected": rejected_count,
            "pending": pending_count,
            "success_rate": round(success_rate, 1),
            "avg_rate_reduction": round(avg_rate_reduction, 2),
        }
    }

"""Prepayment calculator endpoints"""
from fastapi import APIRouter, Depends
from datetime import datetime, timedelta

from ...schemas import PrepaymentCalculation, PrepaymentResult, PrepaymentStrategy
from ...utils.calculator import calculate_prepayment_impact

router = APIRouter()


@router.post("/prepayment", response_model=PrepaymentResult)
async def calculate_prepayment(calculation: PrepaymentCalculation):
    """Calculate prepayment impact"""
    new_emi, new_tenure, interest_saved, schedule_before, schedule_after = calculate_prepayment_impact(
        principal=calculation.loan_amount,
        annual_rate=calculation.interest_rate,
        remaining_tenure=calculation.remaining_tenure_months,
        current_emi=calculation.emi_amount,
        prepayment_amount=calculation.prepayment_amount,
        strategy=calculation.strategy
    )
    
    # Calculate tenure reduced
    tenure_reduced = None
    if calculation.strategy == PrepaymentStrategy.REDUCE_TENURE:
        tenure_reduced = calculation.remaining_tenure_months - new_tenure
    
    # Calculate new closure date from final amortization row
    new_closure_date = schedule_after[-1].date if schedule_after else None
    
    # Return full amortization schedules (frontend can paginate if needed)
    return PrepaymentResult(
        new_emi=new_emi if calculation.strategy == PrepaymentStrategy.REDUCE_EMI else None,
        new_tenure_months=new_tenure if calculation.strategy == PrepaymentStrategy.REDUCE_TENURE else None,
        interest_saved=interest_saved,
        tenure_reduced=tenure_reduced,
        new_closure_date=new_closure_date,
        amortization_before=schedule_before,
        amortization_after=schedule_after
    )

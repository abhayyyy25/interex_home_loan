"""Loan calculator utilities"""
from datetime import datetime, timedelta
from typing import List, Tuple
import math
from ..schemas import AmortizationRow, PrepaymentStrategy


def calculate_emi(principal: float, annual_rate: float, tenure_months: int) -> float:
    """Calculate EMI using the standard EMI formula"""
    monthly_rate = annual_rate / 12 / 100
    if monthly_rate == 0:
        return principal / tenure_months
    
    emi = (principal * monthly_rate * math.pow(1 + monthly_rate, tenure_months)) / \
          (math.pow(1 + monthly_rate, tenure_months) - 1)
    
    return round(emi, 2)


def generate_amortization_schedule(
    principal: float,
    annual_rate: float,
    emi: float,
    tenure_months: int,
    start_date: datetime = None
) -> List[AmortizationRow]:
    """Generate complete amortization schedule"""
    if start_date is None:
        start_date = datetime.now()
    
    schedule = []
    outstanding = principal
    monthly_rate = annual_rate / 12 / 100
    
    for month in range(1, tenure_months + 1):
        interest = outstanding * monthly_rate
        principal_payment = min(emi - interest, outstanding)
        outstanding -= principal_payment
        
        # Ensure outstanding doesn't go negative
        if outstanding < 0:
            outstanding = 0
        
        schedule.append(AmortizationRow(
            month=month,
            date=start_date + timedelta(days=30 * month),
            emi=emi,
            principal=round(principal_payment, 2),
            interest=round(interest, 2),
            outstanding=round(outstanding, 2)
        ))
        
        if outstanding <= 0:
            break
    
    return schedule


def calculate_prepayment_impact(
    principal: float,
    annual_rate: float,
    remaining_tenure: int,
    current_emi: float,
    prepayment_amount: float,
    strategy: PrepaymentStrategy
) -> Tuple[float, int, float, List[AmortizationRow], List[AmortizationRow]]:
    """
    Calculate the impact of prepayment
    
    Returns:
        (new_emi, new_tenure, interest_saved, schedule_before, schedule_after)
    """
    monthly_rate = annual_rate / 12 / 100
    
    # Generate amortization before prepayment
    schedule_before = generate_amortization_schedule(
        principal, annual_rate, current_emi, remaining_tenure
    )
    
    # Calculate new principal after prepayment
    new_principal = principal - prepayment_amount
    
    if strategy == PrepaymentStrategy.REDUCE_EMI:
        # Reduce EMI, keep tenure same
        new_emi = calculate_emi(new_principal, annual_rate, remaining_tenure)
        new_tenure = remaining_tenure
        
        # Generate amortization after prepayment
        schedule_after = generate_amortization_schedule(
            new_principal, annual_rate, new_emi, new_tenure
        )
        
        # Calculate interest saved properly by summing actual interest from schedules
        total_interest_before = sum(row.interest for row in schedule_before)
        total_interest_after = sum(row.interest for row in schedule_after)
        interest_saved = total_interest_before - total_interest_after
        
        return new_emi, new_tenure, interest_saved, schedule_before, schedule_after
    
    else:  # REDUCE_TENURE
        # Reduce tenure, keep EMI same
        new_emi = current_emi
        
        if current_emi <= new_principal * monthly_rate:
            # EMI not sufficient to repay loan
            new_tenure = remaining_tenure
        else:
            # Calculate new tenure
            if monthly_rate > 0:
                numerator = math.log(current_emi / (current_emi - new_principal * monthly_rate))
                denominator = math.log(1 + monthly_rate)
                new_tenure = math.ceil(numerator / denominator)
            else:
                new_tenure = int(new_principal / current_emi)
        
        # Generate amortization after prepayment
        schedule_after = generate_amortization_schedule(
            new_principal, annual_rate, new_emi, new_tenure
        )
        
        # Calculate interest saved properly by summing actual interest from schedules
        total_interest_before = sum(row.interest for row in schedule_before)
        total_interest_after = sum(row.interest for row in schedule_after)
        interest_saved = total_interest_before - total_interest_after
        
        return new_emi, new_tenure, interest_saved, schedule_before, schedule_after


def calculate_interest_saved_lifetime(
    original_amount: float,
    current_outstanding: float,
    annual_rate: float,
    remaining_tenure: int,
    emi: float
) -> float:
    """Calculate total interest that would be paid over remaining tenure"""
    total_to_be_paid = emi * remaining_tenure
    interest_portion = total_to_be_paid - current_outstanding
    return max(0, interest_portion)

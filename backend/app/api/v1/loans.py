"""Loan management endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime, timedelta, timezone

from ...database import get_db
from ...models import User, Loan
from ...schemas import LoanCreate, LoanUpdate, LoanResponse
from ...security import get_current_user

router = APIRouter()


@router.post("/", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
async def create_loan(  
    loan_data: LoanCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new loan (correct calculations)"""

    start_date = loan_data.start_date.replace(tzinfo=None)

    # 1️⃣ Calculate end date
    from dateutil.relativedelta import relativedelta
    end_date = (start_date + relativedelta(months=loan_data.tenure_months)).replace(tzinfo=None)

    # 2️⃣ Calculate remaining tenure
    today = datetime.now()
    remaining_months = max(((end_date.year - today.year) * 12) + (end_date.month - today.month), 1)

    # 3️⃣ Outstanding principal (simple estimation)
    outstanding = loan_data.loan_amount * (remaining_months / loan_data.tenure_months)

    # 4️⃣ Next EMI date
    next_emi = (start_date + relativedelta(months=1)).replace(tzinfo=None)

    new_loan = Loan(
        user_id=current_user.id,
        bank_name=loan_data.bank_name,
        loan_amount=loan_data.loan_amount,
        outstanding_principal=outstanding,
        interest_rate=loan_data.interest_rate,
        emi_amount=loan_data.emi_amount,
        tenure_months=loan_data.tenure_months,
        remaining_tenure_months=remaining_months,
        start_date=start_date,
        next_emi_date=next_emi,
        account_number=loan_data.account_number,
        is_active=True
    )

    db.add(new_loan)
    await db.commit()
    await db.refresh(new_loan)

    return new_loan



@router.get("/", response_model=List[LoanResponse])
async def get_loans(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all loans for the current user"""
    result = await db.execute(
        select(Loan).where(Loan.user_id == current_user.id).where(Loan.is_active == True)
    )
    loans = result.scalars().all()
    return loans


@router.get("/{loan_id}", response_model=LoanResponse)
async def get_loan(
    loan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific loan"""
    result = await db.execute(
        select(Loan).where(Loan.id == loan_id).where(Loan.user_id == current_user.id)
    )
    loan = result.scalar_one_or_none()
    
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found"
        )
    
    return loan


@router.patch("/{loan_id}", response_model=LoanResponse)
async def update_loan(
    loan_id: int,
    loan_data: LoanUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a loan"""
    result = await db.execute(
        select(Loan).where(Loan.id == loan_id).where(Loan.user_id == current_user.id)
    )
    loan = result.scalar_one_or_none()
    
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found"
        )
    
    # Update fields
    if loan_data.bank_name is not None:
        loan.bank_name = loan_data.bank_name
    if loan_data.interest_rate is not None:
        loan.interest_rate = loan_data.interest_rate
    if loan_data.emi_amount is not None:
        loan.emi_amount = loan_data.emi_amount
    
    await db.commit()
    await db.refresh(loan)
    
    return loan


@router.delete("/{loan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_loan(
    loan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a loan"""
    result = await db.execute(
        select(Loan).where(Loan.id == loan_id).where(Loan.user_id == current_user.id)
    )
    loan = result.scalar_one_or_none()
    
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found"
        )
    
    loan.is_active = False
    await db.commit()
    
    return None

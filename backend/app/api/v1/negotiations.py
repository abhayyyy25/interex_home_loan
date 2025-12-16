"""Rate negotiation endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
import json

from ...database import get_db
from ...models import User, Loan, NegotiationRequest, BankRate, NegotiationStatus, UserRole
from ...schemas import NegotiationCreate, NegotiationResponse, NegotiationApproval
from ...security import get_current_user
from ...config import settings
from ...services.notification_service import NotificationService

router = APIRouter()


async def generate_negotiation_letter(
    user: User,
    loan: Loan,
    target_rate: float,
    market_rates: List[BankRate]
) -> str:
    """Generate negotiation letter using AI with market rate context"""
    # Calculate payment history
    months_paid = loan.tenure_months - loan.remaining_tenure_months
    years_paid = months_paid // 12
    
    # Fallback template
    fallback_letter = f"""Dear Sir/Madam,

Subject: Request for Home Loan Interest Rate Reduction

I am writing to request a review of my home loan interest rate. I have been a loyal customer of {loan.bank_name} for {years_paid} years and have maintained a perfect repayment track record.

Current Loan Details:
- Loan Amount: ₹{loan.loan_amount:,.0f}
- Outstanding Principal: ₹{loan.outstanding_principal:,.0f}
- Current Interest Rate: {loan.interest_rate}% p.a.
- Monthly EMI: ₹{loan.emi_amount:,.0f}
- Account: {loan.account_number or 'N/A'}

Market Analysis:
Based on current market conditions, several banks are offering competitive rates. I request a rate reduction to {target_rate}% p.a., which aligns with market standards and would strengthen our long-term relationship.

This reduction would result in significant interest savings while maintaining my commitment to timely payments.

Thank you for your consideration.

Sincerely,
{user.first_name or ''} {user.last_name or ''}"""
    
    if not settings.OPENAI_API_KEY:
        return fallback_letter
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Build market context
        market_context = []
        if market_rates:
            for rate in market_rates[:5]:
                market_context.append({
                    "bank": rate.bank_name,
                    "rate": rate.interest_rate
                })
        
        prompt = f"""Generate a professional, persuasive bank rate negotiation letter for an Indian home loan customer.

Customer Details:
- Name: {user.first_name or ''} {user.last_name or ''}
- Bank: {loan.bank_name}
- Account Number: {loan.account_number or 'N/A'}
- Payment History: {months_paid} months ({years_paid} years) - Perfect record
- Current Interest Rate: {loan.interest_rate}% p.a.
- Target Interest Rate: {target_rate}% p.a.
- Loan Amount: ₹{loan.loan_amount:,.0f}
- Outstanding Principal: ₹{loan.outstanding_principal:,.0f}
- Monthly EMI: ₹{loan.emi_amount:,.0f}

Current Market Rates (for reference):
{json.dumps(market_context, indent=2)}

The letter should:
1. Be respectful and professional in tone
2. Highlight the customer's excellent {years_paid}-year payment history
3. Reference specific competing bank rates as market justification
4. Explain mutual benefits (customer loyalty + bank retention)
5. Request rate reduction to {target_rate}% p.a.
6. Be formatted as a formal business letter with subject line
7. Use Indian rupee notation (₹) and lakhs/crores appropriately
8. Include specific financial figures and potential savings
9. Be concise (300-350 words) but persuasive
10. End with professional closing

Generate only the letter content, no additional commentary."""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=700,
            temperature=0.7,
        )
        
        return response.choices[0].message.content or fallback_letter
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return fallback_letter


@router.post("/", response_model=NegotiationResponse, status_code=status.HTTP_201_CREATED)
async def create_negotiation(
    negotiation_data: NegotiationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new rate negotiation request"""
    # Get the loan
    result = await db.execute(
        select(Loan).where(
            Loan.id == negotiation_data.loan_id,
            Loan.user_id == current_user.id
        )
    )
    loan = result.scalar_one_or_none()
    
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found"
        )
    
    # Get current market rates for context
    market_result = await db.execute(
        select(BankRate).order_by(BankRate.last_updated.desc()).limit(5)
    )
    market_rates = market_result.scalars().all()
    
    # Generate negotiation letter
    letter_content = await generate_negotiation_letter(
        current_user,
        loan,
        negotiation_data.target_rate,
        market_rates
    )
    
    # Create negotiation request
    negotiation = NegotiationRequest(
        user_id=current_user.id,
        loan_id=loan.id,
        current_rate=loan.interest_rate,
        target_rate=negotiation_data.target_rate,
        letter_content=letter_content,
        status=NegotiationStatus.PENDING,
    )
    
    db.add(negotiation)
    await db.commit()
    await db.refresh(negotiation)
    
    return negotiation


@router.get("/", response_model=List[NegotiationResponse])
async def get_negotiations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all negotiation requests for the current user"""
    result = await db.execute(
        select(NegotiationRequest)
        .where(NegotiationRequest.user_id == current_user.id)
        .order_by(NegotiationRequest.created_at.desc())
    )
    negotiations = result.scalars().all()
    return negotiations


@router.get("/{negotiation_id}/", response_model=NegotiationResponse)
async def get_negotiation(
    negotiation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific negotiation request"""
    result = await db.execute(
        select(NegotiationRequest).where(
            NegotiationRequest.id == negotiation_id,
            NegotiationRequest.user_id == current_user.id
        )
    )
    negotiation = result.scalar_one_or_none()
    
    if not negotiation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Negotiation request not found"
        )
    
    return negotiation


@router.patch("/{negotiation_id}/approve/", response_model=NegotiationResponse)
async def approve_negotiation(
    negotiation_id: int,
    approval: NegotiationApproval,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Approve negotiation request"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(NegotiationRequest).where(NegotiationRequest.id == negotiation_id)
    )
    negotiation = result.scalar_one_or_none()
    
    if not negotiation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Negotiation request not found"
        )
    
    negotiation.status = NegotiationStatus.APPROVED
    negotiation.admin_notes = approval.admin_notes
    negotiation.reviewed_at = datetime.now()
    
    await db.commit()
    await db.refresh(negotiation)
    
    # Get loan details for notification
    loan_result = await db.execute(
        select(Loan).where(Loan.id == negotiation.loan_id)
    )
    loan = loan_result.scalar_one_or_none()
    
    # Send notification to user
    if loan:
        await NotificationService.notify_negotiation_update(
            db=db,
            user_id=negotiation.user_id,
            negotiation_id=negotiation.id,
            status="approved",
            bank_name=loan.bank_name,
            admin_notes=approval.admin_notes
        )
    
    return negotiation


@router.patch("/{negotiation_id}/reject/", response_model=NegotiationResponse)
async def reject_negotiation(
    negotiation_id: int,
    approval: NegotiationApproval,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Reject negotiation request"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(NegotiationRequest).where(NegotiationRequest.id == negotiation_id)
    )
    negotiation = result.scalar_one_or_none()
    
    if not negotiation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Negotiation request not found"
        )
    
    negotiation.status = NegotiationStatus.REJECTED
    negotiation.admin_notes = approval.admin_notes
    negotiation.reviewed_at = datetime.now()
    
    await db.commit()
    await db.refresh(negotiation)
    
    # Get loan details for notification
    loan_result = await db.execute(
        select(Loan).where(Loan.id == negotiation.loan_id)
    )
    loan = loan_result.scalar_one_or_none()
    
    # Send notification to user
    if loan:
        await NotificationService.notify_negotiation_update(
            db=db,
            user_id=negotiation.user_id,
            negotiation_id=negotiation.id,
            status="rejected",
            bank_name=loan.bank_name,
            admin_notes=approval.admin_notes
        )
    
    return negotiation


@router.get("/admin/all/", response_model=List[NegotiationResponse])
async def get_all_negotiations_admin(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Get all negotiation requests with optional status filter"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    query = select(NegotiationRequest).order_by(NegotiationRequest.created_at.desc())
    
    if status_filter:
        try:
            query = query.where(NegotiationRequest.status == NegotiationStatus(status_filter))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status_filter}"
            )
    
    result = await db.execute(query)
    negotiations = result.scalars().all()
    return negotiations

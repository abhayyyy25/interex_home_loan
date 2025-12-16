"""Admin endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from datetime import datetime, timedelta
from decimal import Decimal

from ...database import get_db
from ...models import User, Loan, NegotiationRequest, UserRole ,NegotiationStatus
from ...schemas import NegotiationResponse, NegotiationApproval
from ...security import require_admin, get_current_user, get_password_hash
from ...services.notification_service import NotificationService

router = APIRouter()


@router.get("/stats/")
async def get_admin_stats(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin stats using REAL database fields.
    Works safely with your NegotiationRequest + Loan models.
    """

    # -------- Basic counts --------
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    premium_users = (await db.execute(
        select(func.count(User.id)).where(User.subscription_tier == "premium")
    )).scalar() or 0

    pending_negotiations = (await db.execute(
        select(func.count(NegotiationRequest.id))
        .where(NegotiationRequest.status == NegotiationStatus.PENDING)
    )).scalar() or 0

    total_loans = (await db.execute(
        select(func.count(Loan.id))
    )).scalar() or 0

    # Distinct Banks Count
    banks_count = (await db.execute(
        select(func.count(func.distinct(Loan.bank_name)))
    )).scalar() or 0

    # -------- Savings from APPROVED negotiations --------
    total_savings = 0.0

    approved_result = await db.execute(
        select(NegotiationRequest).where(
            NegotiationRequest.status == NegotiationStatus.APPROVED
        )
    )
    approved_items = approved_result.scalars().all()

    for item in approved_items:
        old_rate = item.current_rate       # ✔ REAL DB field
        new_rate = item.target_rate        # ✔ REAL DB field

        if old_rate is None or new_rate is None:
            continue

        try:
            reduction = float(old_rate) - float(new_rate)
        except:
            continue

        if reduction <= 0:
            continue

        # Fetch loan to get accurate principal
        loan_result = await db.execute(
            select(Loan).where(Loan.id == item.loan_id)
        )
        loan = loan_result.scalar_one_or_none()

        if loan:
            principal = float(loan.loan_amount)   # ✔ REAL loan amount
        else:
            principal = 100000  # fallback

        # Simple yearly savings estimate
        annual_savings = principal * (reduction / 100.0)
        total_savings += annual_savings

    # -------- Return Final Stats --------
    return {
        "total_users": total_users,
        "premium_users": premium_users,
        "pending_negotiations": pending_negotiations,
        "total_loans": total_loans,
        "banks": banks_count,
        "total_savings_generated": round(total_savings),
    }

@router.get("/users/")
async def get_all_users(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin: List all users with loan count"""
    result = await db.execute(select(User))
    users = result.scalars().all()

    data = []
    for u in users:
        loan_result = await db.execute(
            select(func.count(Loan.id)).where(Loan.user_id == u.id)
        )
        loan_count = loan_result.scalar()

        data.append({
            "id": u.id,
            # FIX: Combine first and last name
            "name": f"{u.first_name} {u.last_name}", 
            "email": u.email,
            "tier": u.subscription_tier,
            "loan_count": loan_count,
            "joined": u.created_at,
            # Ensure role is a string (handle enum if necessary)
            "role": u.role.value if hasattr(u.role, 'value') else str(u.role)
        })

    return data


@router.get("/negotiations", response_model=List[NegotiationResponse])
async def get_pending_negotiations(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all pending negotiation requests"""
    result = await db.execute(
        select(NegotiationRequest)
        .where(NegotiationRequest.status == "pending")
        .order_by(NegotiationRequest.created_at.desc())
    )
    negotiations = result.scalars().all()
    return negotiations


@router.post("/negotiations/{negotiation_id}/approve", response_model=NegotiationResponse)
async def approve_negotiation(
    negotiation_id: int,
    approval: NegotiationApproval,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Approve a negotiation request"""
    result = await db.execute(
        select(NegotiationRequest).where(NegotiationRequest.id == negotiation_id)
    )
    negotiation = result.scalar_one_or_none()
    
    if not negotiation:
        raise HTTPException(status_code=404, detail="Negotiation request not found")
    
    negotiation.status = "approved"
    negotiation.admin_notes = approval.admin_notes
    negotiation.updated_at = datetime.now()
    
    await db.commit()
    await db.refresh(negotiation)
    
    # TODO: Send notification to user
    # TODO: Trigger email with letter
    
    return negotiation


@router.post("/negotiations/{negotiation_id}/reject", response_model=NegotiationResponse)
async def reject_negotiation(
    negotiation_id: int,
    approval: NegotiationApproval,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Reject a negotiation request"""
    result = await db.execute(
        select(NegotiationRequest).where(NegotiationRequest.id == negotiation_id)
    )
    negotiation = result.scalar_one_or_none()
    
    if not negotiation:
        raise HTTPException(status_code=404, detail="Negotiation request not found")
    
    negotiation.status = "rejected"
    negotiation.admin_notes = approval.admin_notes
    negotiation.updated_at = datetime.now()
    
    await db.commit()
    await db.refresh(negotiation)
    
    # Notification already sent via negotiations endpoint
    
    return negotiation


@router.post("/notifications/demo", status_code=status.HTTP_201_CREATED)
async def create_demo_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Create demo notifications for testing the notification system"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get a customer user who has an active loan (prioritize users with loans)
    loan_result = await db.execute(
        select(Loan)
        .join(User, Loan.user_id == User.id)
        .where(User.role == UserRole.CUSTOMER)
        .where(Loan.is_active == True)
        .limit(1)
    )
    loan = loan_result.scalar_one_or_none()
    
    demo_user = None
    if loan:
        # Get the user who owns this loan
        user_result = await db.execute(
            select(User).where(User.id == loan.user_id)
        )
        demo_user = user_result.scalar_one_or_none()
    else:
        # Fallback: get any customer user
        result = await db.execute(
            select(User).where(User.role == UserRole.CUSTOMER).limit(1)
        )
        demo_user = result.scalar_one_or_none()
    
    if not demo_user:
        # Use admin user if no customer exists
        demo_user = current_user
    
    notifications_created = []
    
    if loan:
        # 1. Rate change notification
        await NotificationService.notify_rate_change(
            db=db,
            user_id=demo_user.id,
            bank_name=loan.bank_name,
            old_rate=Decimal("8.75"),
            new_rate=Decimal("8.25"),
            loan_id=loan.id
        )
        notifications_created.append("Rate change alert")
        
        # 2. Prepayment opportunity
        await NotificationService.notify_prepayment_opportunity(
            db=db,
            user_id=demo_user.id,
            loan_id=loan.id,
            bank_name=loan.bank_name,
            potential_savings=Decimal("275000"),
            recommended_amount=Decimal("100000")
        )
        notifications_created.append("Prepayment opportunity")
        
        # 3. Milestone celebration
        await NotificationService.notify_milestone(
            db=db,
            user_id=demo_user.id,
            loan_id=loan.id,
            bank_name=loan.bank_name,
            milestone_type="25_percent_paid",
            milestone_value=25.0
        )
        notifications_created.append("Milestone celebration")
        
        # 4. EMI reminder
        next_emi_date = datetime.now() + timedelta(days=5)
        await NotificationService.notify_emi_reminder(
            db=db,
            user_id=demo_user.id,
            loan_id=loan.id,
            bank_name=loan.bank_name,
            emi_amount=loan.emi_amount,
            due_date=next_emi_date
        )
        notifications_created.append("EMI reminder")
    
    # 5. Repo rate change (doesn't require loan)
    await NotificationService.notify_repo_rate_change(
        db=db,
        user_id=demo_user.id,
        old_rate=Decimal("6.50"),
        new_rate=Decimal("6.25")
    )
    notifications_created.append("RBI repo rate change")
    
    return {
        "message": f"Created {len(notifications_created)} demo notifications for user {demo_user.email}",
        "notifications": notifications_created,
        "user_id": demo_user.id
    }
# --- ADD THIS TO THE BOTTOM OF admin.py ---

@router.post("/promote-me-to-admin/")
async def make_me_admin(
    email: str,
    db: AsyncSession = Depends(get_db)
):
    """Temporary endpoint to upgrade a user to ADMIN role"""
    # 1. Find the user by email
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail=f"User with email {email} not found")

    # 2. Update Role and Tier
    user.role = UserRole.ADMIN
    user.subscription_tier = "premium"  # Give premium access too
    
    # 3. Save changes
    await db.commit()
    await db.refresh(user)

    return {
        "message": "Success! You are now an Admin.",
        "user": user.email,
        "new_role": user.role,
        "new_tier": user.subscription_tier
    }
@router.post("/force-password-reset/")
async def force_password_reset(
    email: str,
    new_password: str,
    db: AsyncSession = Depends(get_db)
):
    """Temporary endpoint to reset a user's password"""
    # 1. Find the user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Update the password (CORRECTED COLUMN NAME)
    # Your auth.py uses 'password_hash', so we must use that here too.
    user.password_hash = get_password_hash(new_password)
    
    # 3. Save
    await db.commit()
    await db.refresh(user)
    
    return {"message": f"Password for {email} has been reset (Correctly updated 'password_hash')."}


# ===============================================
# ADMIN NOTIFICATION SEND ENDPOINT
# ===============================================
from pydantic import BaseModel
from typing import Optional as Opt
from ...models import Notification, NotificationType
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
import logging

logger = logging.getLogger(__name__)

class AdminNotificationPayload(BaseModel):
    title: str
    message: str
    notification_type: str  # SYSTEM, LOAN, NEGOTIATION, PROMOTION
    receiver_type: str  # "all" or "selected"
    selected_user_id: Opt[str] = None
    selected_user_email: Opt[str] = None


@router.post("/notifications/send/", status_code=status.HTTP_201_CREATED)
async def send_admin_notification(
    payload: AdminNotificationPayload,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin endpoint to send notifications to all users or a specific user.
    """
    # Map notification type string to enum
    type_mapping = {
        "SYSTEM": NotificationType.SYSTEM,
        "LOAN": NotificationType.LOAN,
        "NEGOTIATION": NotificationType.NEGOTIATION,
        "PROMOTION": NotificationType.PROMOTION,
    }
    
    notification_type = type_mapping.get(payload.notification_type.upper())
    if not notification_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid notification type. Must be one of: {list(type_mapping.keys())}"
        )
    
    notifications_created = 0
    target_users = []
    
    if payload.receiver_type == "all":
        # Get all users
        result = await db.execute(select(User))
        target_users = result.scalars().all()
    elif payload.receiver_type == "selected":
        # Find specific user by ID or email
        if payload.selected_user_id:
            result = await db.execute(
                select(User).where(User.id == payload.selected_user_id)
            )
        elif payload.selected_user_email:
            result = await db.execute(
                select(User).where(User.email == payload.selected_user_email)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Must provide selected_user_id or selected_user_email for selected receiver type"
            )
        
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected user not found"
            )
        target_users = [user]
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="receiver_type must be 'all' or 'selected'"
        )
    
    if not target_users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No users found to send notifications to"
        )
    
    # Create notifications for all target users
    for user in target_users:
        # Verify user exists before creating notification (FK check)
        user_exists = await db.execute(
            select(User.id).where(User.id == user.id)
        )
        if not user_exists.scalar_one_or_none():
            logger.warning(f"Skipping notification for non-existent user_id: {user.id}")
            continue
            
        notification = Notification(
            user_id=str(user.id),  # Ensure user_id is a string
            type=notification_type,
            title=payload.title,
            message=payload.message,
            is_read=False,  # Explicitly set default
            meta_data={
                "sent_by_admin": str(current_user.id),
                "admin_email": current_user.email,
                "broadcast": payload.receiver_type == "all"
            }
        )
        db.add(notification)
        notifications_created += 1
    
    # Wrap commit in try-except for better error diagnosis
    try:
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"IntegrityError while sending notifications: {str(e)}")
        logger.error(f"Original error: {e.orig}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e.orig)}"
        )
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"SQLAlchemyError while sending notifications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error while sending notifications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        )
    
    return {
        "message": f"Successfully sent {notifications_created} notification(s)",
        "notifications_created": notifications_created,
        "receiver_type": payload.receiver_type,
        "notification_type": payload.notification_type
    }

"""Notification generation service"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from typing import Optional
from decimal import Decimal

from ..models import Notification, NotificationType, Loan, User, RepoRate, BankRate
from ..database import get_db


class NotificationService:
    """Service for creating and managing notifications"""
    
    @staticmethod
    async def create_notification(
        db: AsyncSession,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        meta_data: Optional[dict] = None
    ) -> Notification:
        """Create a new notification"""
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            meta_data=meta_data or {}
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        return notification
    
    @staticmethod
    async def notify_rate_change(
        db: AsyncSession,
        user_id: str,
        bank_name: str,
        old_rate: Decimal,
        new_rate: Decimal,
        loan_id: Optional[int] = None
    ):
        """Notify user about bank rate change"""
        rate_diff = new_rate - old_rate
        direction = "increased" if rate_diff > 0 else "decreased"
        
        title = f"{bank_name} Rate {direction.capitalize()}"
        message = (
            f"{bank_name} home loan rates have {direction} from {old_rate}% to {new_rate}%. "
            f"This is a good time to consider rate negotiation."
        )
        
        await NotificationService.create_notification(
            db=db,
            user_id=user_id,
            notification_type=NotificationType.BANK_RATE_CHANGE,
            title=title,
            message=message,
            meta_data={
                "bank_name": bank_name,
                "old_rate": float(old_rate),
                "new_rate": float(new_rate),
                "loan_id": loan_id
            }
        )
    
    @staticmethod
    async def notify_repo_rate_change(
        db: AsyncSession,
        user_id: str,
        old_rate: Decimal,
        new_rate: Decimal
    ):
        """Notify user about RBI repo rate change"""
        rate_diff = new_rate - old_rate
        direction = "increased" if rate_diff > 0 else "decreased"
        
        title = f"RBI Repo Rate {direction.capitalize()}"
        message = (
            f"The RBI repo rate has {direction} from {old_rate}% to {new_rate}%. "
            f"Your bank may adjust home loan rates soon. Consider negotiating for a better rate."
        )
        
        await NotificationService.create_notification(
            db=db,
            user_id=user_id,
            notification_type=NotificationType.REPO_RATE_CHANGE,
            title=title,
            message=message,
            meta_data={
                "old_rate": float(old_rate),
                "new_rate": float(new_rate)
            }
        )
    
    @staticmethod
    async def notify_prepayment_opportunity(
        db: AsyncSession,
        user_id: str,
        loan_id: int,
        bank_name: str,
        potential_savings: Decimal,
        recommended_amount: Decimal
    ):
        """Notify user about prepayment opportunity"""
        title = f"Prepayment Opportunity - {bank_name}"
        message = (
            f"You could save ₹{potential_savings:,.0f} in interest by making a prepayment of "
            f"₹{recommended_amount:,.0f} on your {bank_name} loan. Check the calculator for details."
        )
        
        await NotificationService.create_notification(
            db=db,
            user_id=user_id,
            notification_type=NotificationType.PREPAYMENT_OPPORTUNITY,
            title=title,
            message=message,
            meta_data={
                "loan_id": loan_id,
                "bank_name": bank_name,
                "potential_savings": float(potential_savings),
                "recommended_amount": float(recommended_amount)
            }
        )
    
    @staticmethod
    async def notify_milestone(
        db: AsyncSession,
        user_id: str,
        loan_id: int,
        bank_name: str,
        milestone_type: str,
        milestone_value: Optional[float] = None
    ):
        """Notify user about loan milestone achievement"""
        milestone_messages = {
            "25_percent_paid": {
                "title": "25% Loan Repaid!",
                "message": f"Congratulations! You've repaid 25% of your {bank_name} home loan. Keep up the great work!"
            },
            "50_percent_paid": {
                "title": "Halfway There!",
                "message": f"Amazing progress! You've repaid 50% of your {bank_name} home loan. You're halfway to being debt-free!"
            },
            "75_percent_paid": {
                "title": "75% Complete!",
                "message": f"Fantastic! You've repaid 75% of your {bank_name} home loan. The finish line is in sight!"
            },
            "100_percent_paid": {
                "title": "Loan Fully Repaid!",
                "message": f"Congratulations! You've completely repaid your {bank_name} home loan! You're now debt-free!"
            },
            "1_year_anniversary": {
                "title": "1 Year Anniversary",
                "message": f"It's been 1 year since you started your {bank_name} home loan journey. Great progress!"
            },
            "5_year_anniversary": {
                "title": "5 Year Milestone",
                "message": f"5 years of consistent loan repayment on your {bank_name} loan. Excellent dedication!"
            }
        }
        
        milestone_data = milestone_messages.get(milestone_type, {
            "title": f"Milestone Achieved - {bank_name}",
            "message": f"You've reached an important milestone on your {bank_name} home loan!"
        })
        
        await NotificationService.create_notification(
            db=db,
            user_id=user_id,
            notification_type=NotificationType.MILESTONE,
            title=milestone_data["title"],
            message=milestone_data["message"],
            meta_data={
                "loan_id": loan_id,
                "bank_name": bank_name,
                "milestone_type": milestone_type,
                "milestone_value": milestone_value
            }
        )
    
    @staticmethod
    async def notify_emi_reminder(
        db: AsyncSession,
        user_id: str,
        loan_id: int,
        bank_name: str,
        emi_amount: Decimal,
        due_date: datetime
    ):
        """Notify user about upcoming EMI payment"""
        title = f"EMI Reminder - {bank_name}"
        message = (
            f"Your EMI of ₹{emi_amount:,.0f} for {bank_name} is due on "
            f"{due_date.strftime('%B %d, %Y')}. Ensure sufficient balance in your account."
        )
        
        await NotificationService.create_notification(
            db=db,
            user_id=user_id,
            notification_type=NotificationType.EMI_REMINDER,
            title=title,
            message=message,
            meta_data={
                "loan_id": loan_id,
                "bank_name": bank_name,
                "emi_amount": float(emi_amount),
                "due_date": due_date.isoformat()
            }
        )
    
    @staticmethod
    async def notify_negotiation_update(
        db: AsyncSession,
        user_id: str,
        negotiation_id: int,
        status: str,
        bank_name: str,
        admin_notes: Optional[str] = None
    ):
        """Notify user about negotiation status update"""
        status_messages = {
            "approved": {
                "title": f"Negotiation Approved - {bank_name}",
                "message": f"Your rate negotiation request for {bank_name} has been approved! Download your letter and send it to the bank."
            },
            "rejected": {
                "title": f"Negotiation Update - {bank_name}",
                "message": f"Your rate negotiation request for {bank_name} needs revision. Check admin feedback for details."
            }
        }
        
        notification_data = status_messages.get(status, {
            "title": f"Negotiation Update - {bank_name}",
            "message": f"Your rate negotiation request for {bank_name} has been updated."
        })
        
        if admin_notes and status == "approved":
            notification_data["message"] += f" Admin note: {admin_notes}"
        
        await NotificationService.create_notification(
            db=db,
            user_id=user_id,
            notification_type=NotificationType.NEGOTIATION_UPDATE,
            title=notification_data["title"],
            message=notification_data["message"],
            meta_data={
                "negotiation_id": negotiation_id,
                "bank_name": bank_name,
                "status": status,
                "admin_notes": admin_notes
            }
        )
    
    @staticmethod
    async def check_and_create_demo_notifications(
        db: AsyncSession,
        user_id: str
    ):
        """Create demo notifications for new users to showcase the feature"""
        # Check if user already has notifications
        result = await db.execute(
            select(Notification).where(Notification.user_id == user_id).limit(1)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            return  # User already has notifications
        
        # Get user's first loan if exists
        loan_result = await db.execute(
            select(Loan).where(Loan.user_id == user_id).where(Loan.is_active == True).limit(1)
        )
        loan = loan_result.scalar_one_or_none()
        
        if loan:
            # Create a welcome notification
            await NotificationService.create_notification(
                db=db,
                user_id=user_id,
                notification_type=NotificationType.MILESTONE,
                title="👋 Welcome to Interex!",
                message=f"Your {loan.bank_name} loan has been added. We'll notify you about rate changes, prepayment opportunities, and milestones.",
                meta_data={
                    "loan_id": loan.id,
                    "bank_name": loan.bank_name
                }
            )

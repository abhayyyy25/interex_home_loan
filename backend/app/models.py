"""SQLAlchemy ORM Models for Interex"""
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text,
    ForeignKey, Enum, JSON, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from .database import Base


class UserRole(str, enum.Enum):
    """User roles in the system"""
    CUSTOMER = "customer"
    ADMIN = "admin"


class SubscriptionTier(str, enum.Enum):
    """Subscription tier levels"""
    FREE = "free"
    PREMIUM = "premium"


class NegotiationStatus(str, enum.Enum):
    """Negotiation request status"""
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SENT = "sent"


class NotificationType(str, enum.Enum):
    """Types of notifications"""
    REPO_RATE_CHANGE = "repo_rate_change"
    BANK_RATE_CHANGE = "bank_rate_change"
    PREPAYMENT_OPPORTUNITY = "prepayment_opportunity"
    MILESTONE = "milestone"
    NEGOTIATION_UPDATE = "negotiation_update"
    EMI_REMINDER = "emi_reminder"
    SYSTEM = "system"
    LOAN = "loan"
    NEGOTIATION = "negotiation"
    PROMOTION = "promotion"


class User(Base):
    """User model - both customers and admins"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    subscription_tier = Column(Enum(SubscriptionTier), default=SubscriptionTier.FREE, nullable=False)
    stripe_customer_id = Column(String, unique=True)
    stripe_subscription_id = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    loans = relationship("Loan", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    negotiation_requests = relationship("NegotiationRequest", back_populates="user", cascade="all, delete-orphan")
    savings_reports = relationship("SavingsReport", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")


class Loan(Base):
    """Home loan details"""
    __tablename__ = "loans"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Loan details
    bank_name = Column(String, nullable=False)
    loan_amount = Column(Float, nullable=False)  # Original loan amount in rupees
    outstanding_principal = Column(Float, nullable=False)  # Current outstanding
    interest_rate = Column(Float, nullable=False)  # Annual interest rate (e.g., 8.5 for 8.5%)
    emi_amount = Column(Float, nullable=False)  # Monthly EMI
    tenure_months = Column(Integer, nullable=False)  # Original tenure
    remaining_tenure_months = Column(Integer, nullable=False)  # Remaining months
    start_date = Column(DateTime, nullable=False)
    next_emi_date = Column(DateTime)
    account_number = Column(String)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="loans")
    prepayments = relationship("Prepayment", back_populates="loan", cascade="all, delete-orphan")
    negotiation_requests = relationship("NegotiationRequest", back_populates="loan", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("idx_user_loans", "user_id", "is_active"),
    )


class RepoRate(Base):
    """RBI Repo Rate historical data"""
    __tablename__ = "repo_rates"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    rate = Column(Float, nullable=False)  # Repo rate percentage
    effective_date = Column(DateTime, nullable=False)
    change_bps = Column(Integer)  # Change in basis points from previous rate
    announcement_date = Column(DateTime)
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index("idx_repo_effective_date", "effective_date"),
    )


class BankRate(Base):
    """Bank interest rates for home loans"""
    __tablename__ = "bank_rates"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    bank_name = Column(String, nullable=False)
    interest_rate = Column(Float, nullable=False)
    loan_amount_min = Column(Float)  # Minimum loan amount for this rate
    loan_amount_max = Column(Float)  # Maximum loan amount for this rate
    processing_fee = Column(Float)
    prepayment_allowed = Column(Boolean, default=True)
    prepayment_charges = Column(String)  # Description of prepayment charges
    last_updated = Column(DateTime(timezone=True), server_default=func.now())
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index("idx_bank_rates", "bank_name", "last_updated"),
    )


class Notification(Base):
    """User notifications"""
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    meta_data = Column(JSON)  # Additional data (loan_id, rate changes, etc.) - renamed from metadata to avoid SQLAlchemy conflict
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    
    __table_args__ = (
        Index("idx_user_notifications", "user_id", "is_read", "created_at"),
    )


class NegotiationRequest(Base):
    """Rate negotiation requests"""
    __tablename__ = "negotiation_requests"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    loan_id = Column(Integer, ForeignKey("loans.id", ondelete="CASCADE"), nullable=False)
    
    current_rate = Column(Float, nullable=False)
    target_rate = Column(Float, nullable=False)
    letter_content = Column(Text, nullable=False)  # AI-generated letter
    status = Column(Enum(NegotiationStatus), default=NegotiationStatus.DRAFT, nullable=False)
    admin_notes = Column(Text)
    bank_response = Column(Text)
    success = Column(Boolean)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True))
    sent_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="negotiation_requests")
    loan = relationship("Loan", back_populates="negotiation_requests")
    
    __table_args__ = (
        Index("idx_negotiation_status", "status", "created_at"),
    )


class Prepayment(Base):
    """Prepayment history"""
    __tablename__ = "prepayments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    loan_id = Column(Integer, ForeignKey("loans.id", ondelete="CASCADE"), nullable=False)
    
    amount = Column(Float, nullable=False)  # Prepayment amount
    payment_date = Column(DateTime, nullable=False)
    strategy = Column(String, nullable=False)  # "reduce_emi" or "reduce_tenure"
    interest_saved = Column(Float)  # Calculated interest savings
    tenure_reduced_months = Column(Integer)  # If reduce_tenure strategy
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    loan = relationship("Loan", back_populates="prepayments")
    
    __table_args__ = (
        Index("idx_loan_prepayments", "loan_id", "payment_date"),
    )


class SavingsReport(Base):
    """Monthly/Annual savings reports"""
    __tablename__ = "savings_reports"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    report_type = Column(String, nullable=False)  # "monthly" or "annual"
    period = Column(String, nullable=False)  # "2025-01" or "2025"
    total_prepayments = Column(Float, default=0.0)
    total_interest_saved = Column(Float, default=0.0)
    total_tenure_reduced_months = Column(Integer, default=0)
    ai_narrative = Column(Text)  # AI-generated summary
    report_data = Column(JSON)  # Charts and detailed metrics
    
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="savings_reports")
    
    __table_args__ = (
        Index("idx_user_reports", "user_id", "period"),
    )


class ChatSession(Base):
    """AI Advisor chat sessions"""
    __tablename__ = "chat_sessions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    messages = Column(JSON, nullable=False)  # Array of {role, content, timestamp}
    context_data = Column(JSON)  # User's loan context for RAG
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    
    __table_args__ = (
        Index("idx_user_chats", "user_id", "updated_at"),
    )

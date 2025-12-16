"""Pydantic schemas for API request/response validation"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# Enums
class UserRole(str, Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"


class SubscriptionTier(str, Enum):
    FREE = "free"
    PREMIUM = "premium"


class NegotiationStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SENT = "sent"


class NotificationType(str, Enum):
    REPO_RATE_CHANGE = "repo_rate_change"
    BANK_RATE_CHANGE = "bank_rate_change"
    PREPAYMENT_OPPORTUNITY = "prepayment_opportunity"
    MILESTONE = "milestone"
    NEGOTIATION_UPDATE = "negotiation_update"
    EMI_REMINDER = "emi_reminder"
    # New types for admin notifications
    SYSTEM = "system"
    LOAN = "loan"
    NEGOTIATION = "negotiation"
    PROMOTION = "promotion"


class PrepaymentStrategy(str, Enum):
    REDUCE_EMI = "reduce_emi"
    REDUCE_TENURE = "reduce_tenure"


# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    role: UserRole
    subscription_tier: SubscriptionTier
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# Loan Schemas
class LoanCreate(BaseModel):
    bank_name: str
    loan_amount: float = Field(gt=0)
    interest_rate: float = Field(gt=0)
    emi_amount: float = Field(gt=0)
    tenure_months: int = Field(gt=0)
    start_date: datetime
    account_number: Optional[str] = None


class LoanUpdate(BaseModel):
    bank_name: Optional[str] = None
    interest_rate: Optional[float] = None
    emi_amount: Optional[float] = None


class LoanResponse(BaseModel):
    id: int
    user_id: str
    bank_name: str
    loan_amount: float
    outstanding_principal: float
    interest_rate: float
    emi_amount: float
    tenure_months: int
    remaining_tenure_months: int
    start_date: datetime
    next_emi_date: Optional[datetime]
    account_number: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Calculator Schemas
class PrepaymentCalculation(BaseModel):
    loan_amount: float = Field(gt=0)
    interest_rate: float = Field(gt=0)
    remaining_tenure_months: int = Field(gt=0)
    emi_amount: float = Field(gt=0)
    prepayment_amount: float = Field(gt=0)
    strategy: PrepaymentStrategy


class AmortizationRow(BaseModel):
    month: int
    date: datetime
    emi: float
    principal: float
    interest: float
    outstanding: float


class PrepaymentResult(BaseModel):
    new_emi: Optional[float]
    new_tenure_months: Optional[int]
    interest_saved: float
    tenure_reduced: Optional[int]
    new_closure_date: Optional[datetime]
    amortization_before: List[AmortizationRow]
    amortization_after: List[AmortizationRow]


# Negotiation Schemas
class NegotiationCreate(BaseModel):
    loan_id: int
    target_rate: float = Field(gt=0)


class NegotiationResponse(BaseModel):
    id: int
    user_id: str
    loan_id: int
    current_rate: float
    target_rate: float
    letter_content: str
    status: NegotiationStatus
    admin_notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class NegotiationApproval(BaseModel):
    admin_notes: Optional[str] = None


# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    user_id: str
    type: NotificationType
    title: str
    message: str
    is_read: bool
    meta_data: Optional[dict]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Chat Schemas
class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: datetime


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None


class ChatResponse(BaseModel):
    message: str
    session_id: int


# Report Schemas
class SavingsReportResponse(BaseModel):
    id: int
    user_id: str
    report_type: str
    period: str
    total_prepayments: float
    total_interest_saved: float
    total_tenure_reduced_months: int
    ai_narrative: Optional[str]
    report_data: Optional[dict]
    generated_at: datetime
    
    class Config:
        from_attributes = True


# Repo Rate Schemas
class RepoRateResponse(BaseModel):
    id: int
    rate: float
    effective_date: datetime
    change_bps: Optional[int]
    scraped_at: datetime
    
    class Config:
        from_attributes = True


# Bank Rate Schemas
class BankRateResponse(BaseModel):
    id: int
    bank_name: str
    interest_rate: float
    loan_amount_min: Optional[float]
    loan_amount_max: Optional[float]
    last_updated: datetime
    
    class Config:
        from_attributes = True

// Frontend types for Interex
export type UserRole = "customer" | "admin";
export type SubscriptionTier = "free" | "premium";
export type NegotiationStatus = "draft" | "pending" | "approved" | "rejected" | "sent";
export type NotificationType = "repo_rate_change" | "bank_rate_change" | "prepayment_opportunity" | "milestone" | "negotiation_update" | "emi_reminder";
export type PrepaymentStrategy = "reduce_emi" | "reduce_tenure";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Loan {
  id: number;
  userId: string;
  bankName: string;
  loanAmount: number;
  outstandingPrincipal: number;
  interestRate: number;
  emiAmount: number;
  tenureMonths: number;
  remainingTenureMonths: number;
  startDate: string;
  nextEmiDate?: string;
  accountNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface RepoRate {
  id: number;
  rate: number;
  effectiveDate: string;
  changeBps?: number;
  announcementDate?: string;
  scrapedAt: string;
}

export interface BankRate {
  id: number;
  bankName: string;
  interestRate: number;
  loanAmountMin?: number;
  loanAmountMax?: number;
  processingFee?: number;
  prepaymentAllowed: boolean;
  prepaymentCharges?: string;
  lastUpdated: string;
  scrapedAt: string;
}

export interface Notification {
  id: number;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export interface NegotiationRequest {
  id: number;
  userId: string;
  loanId: number;
  currentRate: number;
  targetRate: number;
  letterContent: string;
  status: NegotiationStatus;
  adminNotes?: string;
  bankResponse?: string;
  success?: boolean;
  createdAt: string;
  reviewedAt?: string;
  sentAt?: string;
}

export interface Prepayment {
  id: number;
  loanId: number;
  amount: number;
  paymentDate: string;
  strategy: PrepaymentStrategy;
  interestSaved?: number;
  tenureReducedMonths?: number;
  createdAt: string;
}

export interface SavingsReport {
  id: number;
  userId: string;
  reportType: "monthly" | "annual";
  period: string;
  totalPrepayments: number;
  totalInterestSaved: number;
  totalTenureReducedMonths: number;
  aiNarrative?: string;
  reportData?: any;
  generatedAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: number;
  userId: string;
  messages: ChatMessage[];
  contextData?: any;
  createdAt: string;
  updatedAt?: string;
}

export interface AmortizationRow {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  outstanding: number;
  date: Date;
}

export interface PrepaymentResult {
  newEmi?: number;
  newTenureMonths?: number;
  interestSaved: number;
  tenureReduced?: number;
  newClosureDate?: Date;
  amortizationBefore: AmortizationRow[];
  amortizationAfter: AmortizationRow[];
}

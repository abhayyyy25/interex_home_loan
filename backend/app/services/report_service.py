"""Report generation service"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime
from typing import Dict, Any, List
import os
import openai  # ✅ OLD SDK WORKS

from ..models import User, Loan, Prepayment, SavingsReport


class ReportService:
    """Service for generating savings reports"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_report(
        self,
        user_id: str,
        report_type: str,
        period: str
    ) -> SavingsReport:
        """Generate a comprehensive savings report"""

        # Parse period
        if report_type == "monthly":
            year = int(period[:4])
            month = int(period[5:7])
            start_date = datetime(year, month, 1)

            if month == 12:
                end_date = datetime(year + 1, 1, 1)
            else:
                end_date = datetime(year, month + 1, 1)

        else:  # annual
            year = int(period)
            start_date = datetime(year, 1, 1)
            end_date = datetime(year + 1, 1, 1)

        # Fetch loans
        loans_result = await self.db.execute(select(Loan).where(Loan.user_id == user_id))
        loans = loans_result.scalars().all()

        # Fetch prepayments
        prepayments_result = await self.db.execute(
            select(Prepayment)
            .join(Loan, Prepayment.loan_id == Loan.id)
            .where(
                and_(
                    Loan.user_id == user_id,
                    Prepayment.payment_date >= start_date,
                    Prepayment.payment_date < end_date
                )
            )
        )
        prepayments = prepayments_result.scalars().all()

        # Totals
        total_prepayments = sum(p.amount for p in prepayments)
        total_interest_saved = sum(p.interest_saved or 0 for p in prepayments)
        total_tenure_reduced = sum(p.tenure_reduced_months or 0 for p in prepayments)

        # Build report data
        report_data = await self._build_report_data(loans, prepayments, report_type, period)

        # AI text
        ai_narrative = await self._generate_ai_narrative(
            total_prepayments,
            total_interest_saved,
            total_tenure_reduced,
            len(loans),
            report_type,
            period
        )

        # Save report
        report = SavingsReport(
            user_id=user_id,
            report_type=report_type,
            period=period,
            total_prepayments=total_prepayments,
            total_interest_saved=total_interest_saved,
            total_tenure_reduced_months=total_tenure_reduced,
            ai_narrative=ai_narrative,
            report_data=report_data
        )

        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)

        return report

    async def _build_report_data(
        self,
        loans: List[Loan],
        prepayments: List[Prepayment],
        report_type: str,
        period: str
    ) -> Dict[str, Any]:

        # Loan portfolio
        portfolio = []
        total_outstanding = 0
        total_paid_off = 0

        for loan in loans:
            loan_paid = loan.loan_amount - loan.outstanding_principal
            total_outstanding += loan.outstanding_principal
            total_paid_off += loan_paid

            portfolio.append({
                "bank_name": loan.bank_name,
                "loan_amount": loan.loan_amount,
                "outstanding": loan.outstanding_principal,
                "paid_off": loan_paid,
                "interest_rate": loan.interest_rate,
                "emi_amount": loan.emi_amount,
                "remaining_months": loan.remaining_tenure_months,
                "is_active": loan.is_active
            })

        # Strategy breakdown
        strategy_breakdown = {
            "reduce_emi": {"count": 0, "amount": 0, "savings": 0},
            "reduce_tenure": {"count": 0, "amount": 0, "savings": 0, "months_saved": 0}
        }

        for prep in prepayments:
            if prep.strategy in strategy_breakdown:
                s = strategy_breakdown[prep.strategy]
                s["count"] += 1
                s["amount"] += prep.amount
                s["savings"] += prep.interest_saved or 0
                if prep.strategy == "reduce_tenure":
                    s["months_saved"] += prep.tenure_reduced_months or 0

        # Monthly prepayments
        monthly_prepayments = [
            {
                "date": prep.payment_date.strftime("%Y-%m-%d"),
                "amount": prep.amount,
                "savings": prep.interest_saved or 0,
                "strategy": prep.strategy
            }
            for prep in prepayments
        ]

        return {
            "portfolio": portfolio,
            "totals": {
                "total_outstanding": total_outstanding,
                "total_paid_off": total_paid_off,
                "total_loan_amount": total_outstanding + total_paid_off,
                "completion_percentage": (
                    (total_paid_off / (total_outstanding + total_paid_off) * 100)
                    if (total_outstanding + total_paid_off) > 0 else 0
                )
            },
            "strategy_breakdown": strategy_breakdown,
            "monthly_prepayments": monthly_prepayments,
            "report_period": period,
            "report_type": report_type
        }

    async def _generate_ai_narrative(
        self,
        total_prepayments: float,
        total_interest_saved: float,
        total_tenure_reduced: int,
        num_loans: int,
        report_type: str,
        period: str
    ) -> str:
        """Generate summary using OLD OpenAI SDK"""

        openai_api_key = os.getenv("OPENAI_API_KEY")

        if not openai_api_key:
            period_text = f"the month of {period}" if report_type == "monthly" else f"the year {period}"
            return (
                f"During {period_text}, you made ₹{total_prepayments:,.0f} in prepayments across "
                f"{num_loans} loan(s), saving ₹{total_interest_saved:,.0f} in interest."
            )

        openai.api_key = openai_api_key

        try:
            period_text = f"the month of {period}" if report_type == "monthly" else f"the year {period}"

            prompt = f"""
Generate a friendly, encouraging financial report narrative for an Indian homeowner.

Period: {period_text}
Prepayments made: ₹{total_prepayments:,.0f}
Interest saved: ₹{total_interest_saved:,.0f}
Tenure reduced: {total_tenure_reduced} months
Active loans: {num_loans}

Write a short, motivational 2–3 sentence message.
"""

            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful financial advisor for Indian homeowners."},
                    {"role": "user", "content": prompt}
                ]
            )

            return response["choices"][0]["message"]["content"].strip()

        except Exception as e:
            return (
                f"During this period, you made ₹{total_prepayments:,.0f} in prepayments "
                f"and saved ₹{total_interest_saved:,.0f} in interest. Keep going!"
            )

    async def get_overall_summary(self, user_id: str) -> Dict[str, Any]:

        loans_result = await self.db.execute(
            select(Loan).where(Loan.user_id == user_id)
        )
        loans = loans_result.scalars().all()

        prepayments_result = await self.db.execute(
            select(Prepayment)
            .join(Loan, Prepayment.loan_id == Loan.id)
            .where(Loan.user_id == user_id)
        )
        prepayments = prepayments_result.scalars().all()

        lifetime_prepayments = sum(p.amount for p in prepayments)
        lifetime_interest_saved = sum(p.interest_saved or 0 for p in prepayments)
        lifetime_tenure_reduced = sum(p.tenure_reduced_months or 0 for p in prepayments)

        total_loan_amount = sum(l.loan_amount for l in loans)
        total_outstanding = sum(l.outstanding_principal for l in loans if l.is_active)
        total_paid = total_loan_amount - total_outstanding
        active_loans = len([l for l in loans if l.is_active])

        return {
            "lifetime": {
                "total_prepayments": lifetime_prepayments,
                "total_interest_saved": lifetime_interest_saved,
                "total_tenure_reduced_months": lifetime_tenure_reduced,
                "prepayment_count": len(prepayments)
            },
            "portfolio": {
                "total_loan_amount": total_loan_amount,
                "total_outstanding": total_outstanding,
                "total_paid": total_paid,
                "completion_percentage": (
                    (total_paid / total_loan_amount * 100)
                    if total_loan_amount > 0 else 0
                ),
                "active_loans": active_loans,
                "total_loans": len(loans)
            }
        }

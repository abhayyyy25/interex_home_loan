"""Seed script for RBI repo rates and bank rates"""
import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import RepoRate, BankRate


async def seed_repo_rates():
    """Add historical RBI repo rates"""
    async with AsyncSessionLocal() as db:
        # Check if data exists
        result = await db.execute(select(RepoRate).limit(1))
        if result.scalar_one_or_none():
            print("Repo rates already exist, skipping...")
            return
        
        # Historical RBI repo rates (sample data)
        repo_rates = [
            {
                "rate": 6.50,
                "effective_date": datetime(2024, 2, 8),
                "change_bps": 0,
                "announcement_date": datetime(2024, 2, 8)
            },
            {
                "rate": 6.50,
                "effective_date": datetime(2024, 4, 5),
                "change_bps": 0,
                "announcement_date": datetime(2024, 4, 5)
            },
            {
                "rate": 6.50,
                "effective_date": datetime(2024, 6, 7),
                "change_bps": 0,
                "announcement_date": datetime(2024, 6, 7)
            },
            {
                "rate": 6.50,
                "effective_date": datetime(2024, 8, 8),
                "change_bps": 0,
                "announcement_date": datetime(2024, 8, 8)
            },
            {
                "rate": 6.50,
                "effective_date": datetime(2024, 10, 9),
                "change_bps": 0,
                "announcement_date": datetime(2024, 10, 9)
            },
            {
                "rate": 6.50,
                "effective_date": datetime(2024, 12, 6),
                "change_bps": 0,
                "announcement_date": datetime(2024, 12, 6)
            },
        ]
        
        for rate_data in repo_rates:
            rate = RepoRate(**rate_data)
            db.add(rate)
        
        await db.commit()
        print(f"[OK] Added {len(repo_rates)} repo rates")


async def seed_bank_rates():
    """Add current bank rates for home loans"""
    async with AsyncSessionLocal() as db:
        # Check if data exists
        result = await db.execute(select(BankRate).limit(1))
        if result.scalar_one_or_none():
            print("Bank rates already exist, skipping...")
            return
        
        # Current bank rates (sample data - realistic Indian bank rates)
        bank_rates = [
            {
                "bank_name": "State Bank of India (SBI)",
                "interest_rate": 8.50,
                "loan_amount_min": 100000,
                "loan_amount_max": 100000000,
                "processing_fee": 0.35,
                "prepayment_allowed": True,
                "prepayment_charges": "No charges for floating rate loans",
                "last_updated": datetime.now()
            },
            {
                "bank_name": "HDFC Bank",
                "interest_rate": 8.75,
                "loan_amount_min": 100000,
                "loan_amount_max": 100000000,
                "processing_fee": 0.50,
                "prepayment_allowed": True,
                "prepayment_charges": "Nil for floating rate loans",
                "last_updated": datetime.now()
            },
            {
                "bank_name": "ICICI Bank",
                "interest_rate": 8.85,
                "loan_amount_min": 100000,
                "loan_amount_max": 100000000,
                "processing_fee": 0.50,
                "prepayment_allowed": True,
                "prepayment_charges": "2% for fixed rate, nil for floating",
                "last_updated": datetime.now()
            },
            {
                "bank_name": "Axis Bank",
                "interest_rate": 9.00,
                "loan_amount_min": 100000,
                "loan_amount_max": 75000000,
                "processing_fee": 1.00,
                "prepayment_allowed": True,
                "prepayment_charges": "Nil for floating rate loans",
                "last_updated": datetime.now()
            },
            {
                "bank_name": "Punjab National Bank (PNB)",
                "interest_rate": 8.40,
                "loan_amount_min": 100000,
                "loan_amount_max": 50000000,
                "processing_fee": 0.35,
                "prepayment_allowed": True,
                "prepayment_charges": "No prepayment charges",
                "last_updated": datetime.now()
            },
            {
                "bank_name": "Bank of Baroda",
                "interest_rate": 8.55,
                "loan_amount_min": 100000,
                "loan_amount_max": 50000000,
                "processing_fee": 0.50,
                "prepayment_allowed": True,
                "prepayment_charges": "Nil for floating rate",
                "last_updated": datetime.now()
            },
            {
                "bank_name": "Kotak Mahindra Bank",
                "interest_rate": 8.90,
                "loan_amount_min": 100000,
                "loan_amount_max": 100000000,
                "processing_fee": 1.00,
                "prepayment_allowed": True,
                "prepayment_charges": "Nil after 6 months",
                "last_updated": datetime.now()
            },
            {
                "bank_name": "IndusInd Bank",
                "interest_rate": 9.25,
                "loan_amount_min": 100000,
                "loan_amount_max": 50000000,
                "processing_fee": 1.00,
                "prepayment_allowed": True,
                "prepayment_charges": "2% on floating rate",
                "last_updated": datetime.now()
            },
            {
                "bank_name": "Union Bank of India",
                "interest_rate": 8.45,
                "loan_amount_min": 100000,
                "loan_amount_max": 50000000,
                "processing_fee": 0.50,
                "prepayment_allowed": True,
                "prepayment_charges": "No charges",
                "last_updated": datetime.now()
            },
            {
                "bank_name": "Canara Bank",
                "interest_rate": 8.60,
                "loan_amount_min": 100000,
                "loan_amount_max": 50000000,
                "processing_fee": 0.50,
                "prepayment_allowed": True,
                "prepayment_charges": "Nil for retail loans",
                "last_updated": datetime.now()
            },
        ]
        
        for rate_data in bank_rates:
            rate = BankRate(**rate_data)
            db.add(rate)
        
        await db.commit()
        print(f"[OK] Added {len(bank_rates)} bank rates")


async def main():
    """Run all seed functions"""
    print("Seeding rate data...")
    await seed_repo_rates()
    await seed_bank_rates()
    print("[OK] Rate data seeding complete!")


if __name__ == "__main__":
    asyncio.run(main())

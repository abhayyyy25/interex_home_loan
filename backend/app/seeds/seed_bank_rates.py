import asyncio
from datetime import datetime
from app.database import AsyncSessionLocal
from app.models import BankRate

async def seed_bank_rates():
    async with AsyncSessionLocal() as db:
        rates = [
            BankRate(
                bank_name="HDFC Bank",
                interest_rate=8.40,
                loan_amount_min=1000000,
                loan_amount_max=50000000,
                processing_fee=1.0,
                prepayment_allowed=True,
                prepayment_charges="Zero for floating loans",
                last_updated=datetime.now()
            ),
            BankRate(
                bank_name="ICICI Bank",
                interest_rate=8.50,
                loan_amount_min=1000000,
                loan_amount_max=50000000,
                processing_fee=1.2,
                prepayment_allowed=True,
                prepayment_charges="No charge",
                last_updated=datetime.now()
            ),
            BankRate(
                bank_name="SBI Home Loans",
                interest_rate=8.30,
                loan_amount_min=500000,
                loan_amount_max=40000000,
                processing_fee=0.8,
                prepayment_allowed=True,
                prepayment_charges="Nil",
                last_updated=datetime.now()
            )
        ]

        db.add_all(rates)
        await db.commit()
        print("[OK] Bank rates inserted successfully!")

asyncio.run(seed_bank_rates())

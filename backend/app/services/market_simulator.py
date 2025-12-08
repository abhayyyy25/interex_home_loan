import asyncio
import random
import logging
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..database import engine
from ..models import Loan, User, BankRate
from ..services.notification_service import NotificationService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MarketSimulator")

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession
)

# -------------------------------------------
# HYBRID MODE — uses BankRate if available,
# otherwise uses Loan data for bank rates.
# -------------------------------------------
async def run_market_simulator():
    logger.info("🔥 Hybrid Market Simulator Running... (every 30 sec)")

    while True:
        async with AsyncSessionLocal() as db:
            try:
                # -----------------------------------------------------------------
                # 1. Fetch all loans (for fallback and for notifications)
                # -----------------------------------------------------------------
                loans_result = await db.execute(
                    select(Loan).where(Loan.is_active == True)
                )
                loans = loans_result.scalars().all()

                if not loans:
                    logger.warning("⚠️ No loans found. Nothing to simulate.")
                    await asyncio.sleep(3600)
                    continue

                # -----------------------------------------------------------------
                # 2. Fetch BankRate table (primary source)
                # ------------------------------------------------------------------
                bankrate_result = await db.execute(select(BankRate))
                bankrate_entries = bankrate_result.scalars().all()

                # DICTIONARY to store bank_rate_source
                bank_rate_source = {}

                if bankrate_entries:
                    logger.info("✔ Using BankRate table for rate simulation.")
                    for b in bankrate_entries:
                        bank_rate_source[b.bank_name] = float(b.interest_rate)
                else:
                    logger.warning("⚠️ No BankRate entries found — Falling back to Loan rates.")
                    for loan in loans:
                        bank_rate_source.setdefault(loan.bank_name, float(loan.interest_rate))

                # -----------------------------------------------------------------
                # 3. Simulate rate changes for each bank
                # -----------------------------------------------------------------
                for bank_name, old_rate in bank_rate_source.items():

                    # Random rate fluctuation
                    change = random.choice([-0.05, 0.05, 0.00])
                    if change == 0:
                        continue

                    new_rate = round(old_rate + change, 2)

                    if not (6.0 <= new_rate <= 12.0):
                        continue

                    logger.info(f"📈 RATE UPDATE: {bank_name}: {old_rate}% → {new_rate}%")

                    # ===========================
                    # CASE A — BankRate table exists
                    # ===========================
                    if bankrate_entries:
                        # Update BankRate entry
                        for b in bankrate_entries:
                            if b.bank_name == bank_name:
                                b.interest_rate = new_rate
                                b.last_updated = datetime.now()

                    # ===========================
                    # CASE B — Fallback to Loan table
                    # ===========================
                    # Update loans for this bank
                    for loan in loans:
                        if loan.bank_name == bank_name:
                            loan.interest_rate = new_rate

                            await NotificationService.notify_rate_change(
                                db=db,
                                user_id=loan.user_id,
                                bank_name=bank_name,
                                old_rate=Decimal(str(old_rate)),
                                new_rate=Decimal(str(new_rate)),
                                loan_id=loan.id
                            )
                            logger.info(f"   🔔 Notification → Loan {loan.id} user {loan.user_id}")

                await db.commit()
                logger.info("💾 Hybrid simulator saved updates & notifications.\n")

            except Exception as e:
                logger.error(f"❌ Simulator Error: {e}")
                import traceback
                traceback.print_exc()
                await db.rollback()

        await asyncio.sleep(3600)

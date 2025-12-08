import asyncio
from datetime import datetime
from app.database import AsyncSessionLocal
from app.models import RepoRate

async def seed_repo_rate():
    async with AsyncSessionLocal() as db:
        repo = RepoRate(
            rate=6.50,
            effective_date=datetime.now(),
            change_bps=0,
            announcement_date=datetime.now()
        )
        db.add(repo)
        await db.commit()
        print("✅ Repo Rate inserted successfully!")

asyncio.run(seed_repo_rate())

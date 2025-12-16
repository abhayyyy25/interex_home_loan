"""Add new notification type enum values

Revision ID: add_notif_types
Revises: 6da93b5a83ac
Create Date: 2025-12-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_notif_types'
down_revision: Union[str, None] = '6da93b5a83ac'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add ALL notification type values to the PostgreSQL enum"""
    # PostgreSQL requires ALTER TYPE to add new enum values
    # These must be run outside of a transaction block
    op.execute("COMMIT")  # End any current transaction
    
    # Add ALL enum values (lowercase) - using IF NOT EXISTS to make this idempotent
    # Original values that might be missing
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'repo_rate_change'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'bank_rate_change'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'prepayment_opportunity'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'milestone'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'negotiation_update'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'emi_reminder'")
    
    # New values added for admin notifications
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'system'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'loan'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'negotiation'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'promotion'")


def downgrade() -> None:
    """
    PostgreSQL doesn't support removing enum values easily.
    For simplicity, we'll just leave the values in place.
    """
    pass


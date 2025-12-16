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
    """Add new values to the notificationtype enum in PostgreSQL"""
    # PostgreSQL requires ALTER TYPE to add new enum values
    # These must be run outside of a transaction block
    op.execute("COMMIT")  # End any current transaction
    
    # Add new enum values if they don't exist
    # Using IF NOT EXISTS to make this idempotent
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'system'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'loan'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'negotiation'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'promotion'")


def downgrade() -> None:
    """
    PostgreSQL doesn't support removing enum values easily.
    To downgrade, you'd need to:
    1. Create a new enum without these values
    2. Update all rows using these values
    3. Drop the old enum and rename the new one
    
    For simplicity, we'll just leave the values in place.
    """
    pass


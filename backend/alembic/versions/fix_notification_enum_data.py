"""Fix existing notification enum data - convert uppercase to lowercase

Revision ID: fix_notif_data
Revises: add_notif_types
Create Date: 2025-12-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fix_notif_data'
down_revision: Union[str, None] = 'add_notif_types'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Fix existing notification data that has uppercase enum names.
    Convert them to lowercase enum values.
    """
    # Map of uppercase names to lowercase values
    mappings = [
        ('REPO_RATE_CHANGE', 'repo_rate_change'),
        ('BANK_RATE_CHANGE', 'bank_rate_change'),
        ('PREPAYMENT_OPPORTUNITY', 'prepayment_opportunity'),
        ('MILESTONE', 'milestone'),
        ('NEGOTIATION_UPDATE', 'negotiation_update'),
        ('EMI_REMINDER', 'emi_reminder'),
        ('SYSTEM', 'system'),
        ('LOAN', 'loan'),
        ('NEGOTIATION', 'negotiation'),
        ('PROMOTION', 'promotion'),
    ]
    
    # Update each notification type from uppercase to lowercase
    for old_value, new_value in mappings:
        op.execute(
            f"""
            UPDATE notifications 
            SET type = '{new_value}' 
            WHERE type::text = '{old_value}'
            """
        )


def downgrade() -> None:
    """
    Revert lowercase values to uppercase names (if needed).
    """
    mappings = [
        ('repo_rate_change', 'REPO_RATE_CHANGE'),
        ('bank_rate_change', 'BANK_RATE_CHANGE'),
        ('prepayment_opportunity', 'PREPAYMENT_OPPORTUNITY'),
        ('milestone', 'MILESTONE'),
        ('negotiation_update', 'NEGOTIATION_UPDATE'),
        ('emi_reminder', 'EMI_REMINDER'),
        ('system', 'SYSTEM'),
        ('loan', 'LOAN'),
        ('negotiation', 'NEGOTIATION'),
        ('promotion', 'PROMOTION'),
    ]
    
    for old_value, new_value in mappings:
        op.execute(
            f"""
            UPDATE notifications 
            SET type = '{new_value}' 
            WHERE type::text = '{old_value}'
            """
        )


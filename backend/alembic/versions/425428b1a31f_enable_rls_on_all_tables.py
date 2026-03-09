"""enable_rls_on_all_tables

Revision ID: 425428b1a31f
Revises: a324673aba2b
Create Date: 2026-03-07 14:23:34.568679

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '425428b1a31f'
down_revision: Union[str, Sequence[str], None] = 'a324673aba2b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # List of tables to enable RLS on
    tables = [
        "user", "invite", "project", 
        "customfluid", "pump", "scenario", 
        "systemlog", "supportticket", "ticketmessage", 
        "alembic_version"
    ]
    
    for table in tables:
        # Check if table exists before altering
        op.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;")


def downgrade() -> None:
    """Downgrade schema."""
    tables = [
        "user", "invite", "project", 
        "customfluid", "pump", "scenario", 
        "systemlog", "supportticket", "ticketmessage", 
        "alembic_version"
    ]
    for table in tables:
        op.execute(f"ALTER TABLE public.{table} DISABLE ROW LEVEL SECURITY;")

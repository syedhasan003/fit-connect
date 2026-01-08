"""fix reserved metadata field in health_memory

Revision ID: 148ef2e81f98
Revises: e994997769f2
Create Date: 2025-12-17 11:05:08.766792
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '148ef2e81f98'
down_revision: Union[str, Sequence[str], None] = 'e994997769f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- health_memories ---
    op.create_table(
        'health_memories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('memory_data', sa.JSON(), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('(CURRENT_TIMESTAMP)'),
            nullable=True
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(
        op.f('ix_health_memories_id'),
        'health_memories',
        ['id'],
        unique=False
    )

    # --- reminders ---
    op.create_table(
        'reminders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(), nullable=True),
        sa.Column('message', sa.String(), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('consent_required', sa.Boolean(), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('(CURRENT_TIMESTAMP)'),
            nullable=True
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reminders_id'), 'reminders', ['id'], unique=False)
    op.create_index(op.f('ix_reminders_type'), 'reminders', ['type'], unique=False)

    # --- reminder_logs modifications ---
    op.add_column('reminder_logs', sa.Column('reminder_id', sa.Integer(), nullable=False))
    op.add_column('reminder_logs', sa.Column('acknowledged', sa.Boolean(), nullable=True))
    op.add_column('reminder_logs', sa.Column('acknowledged_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('reminder_logs', sa.Column('missed_reason', sa.String(), nullable=True))

    # ✅ SQLITE-SAFE FK CREATION
    with op.batch_alter_table('reminder_logs') as batch_op:
        batch_op.create_foreign_key(
            'fk_reminder_logs_reminder_id',
            'reminders',
            ['reminder_id'],
            ['id']
        )

    # --- cleanup old columns ---
    op.drop_column('reminder_logs', 'scheduled_for')
    op.drop_column('reminder_logs', 'responded_at')
    op.drop_column('reminder_logs', 'action_taken')
    op.drop_column('reminder_logs', 'reminder_type')


def downgrade() -> None:
    # --- restore old reminder_logs columns ---
    op.add_column('reminder_logs', sa.Column('reminder_type', sa.String(), nullable=False))
    op.add_column('reminder_logs', sa.Column('action_taken', sa.Boolean(), nullable=True))
    op.add_column('reminder_logs', sa.Column('responded_at', sa.DateTime(), nullable=True))
    op.add_column('reminder_logs', sa.Column('scheduled_for', sa.DateTime(), nullable=False))

    with op.batch_alter_table('reminder_logs') as batch_op:
        batch_op.drop_constraint('fk_reminder_logs_reminder_id', type_='foreignkey')

    op.drop_column('reminder_logs', 'missed_reason')
    op.drop_column('reminder_logs', 'acknowledged_at')
    op.drop_column('reminder_logs', 'acknowledged')
    op.drop_column('reminder_logs', 'reminder_id')

    # --- reminders ---
    op.drop_index(op.f('ix_reminders_type'), table_name='reminders')
    op.drop_index(op.f('ix_reminders_id'), table_name='reminders')
    op.drop_table('reminders')

    # --- health_memories ---
    op.drop_index(op.f('ix_health_memories_id'), table_name='health_memories')
    op.drop_table('health_memories')

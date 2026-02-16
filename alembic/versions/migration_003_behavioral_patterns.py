"""create behavioral patterns and ai coaching log

Revision ID: 003_behavioral_patterns
Revises: 002_workout_sessions
Create Date: 2026-02-17

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_behavioral_patterns'
down_revision = '002_workout_sessions'
branch_labels = None
depends_on = None


def upgrade():
    # Create behavioral_patterns table
    op.create_table(
        'behavioral_patterns',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('pattern_type', sa.Enum('timing', 'form', 'adherence', 'motivation', 'energy', 'recovery', name='pattern_type'), nullable=False),
        sa.Column('context', sa.Text(), nullable=True),
        sa.Column('observation', sa.Text(), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False, server_default='0.5'),
        sa.Column('first_observed', sa.DateTime(), nullable=False),
        sa.Column('last_observed', sa.DateTime(), nullable=False),
        sa.Column('occurrence_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('ai_interpretation', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_behavioral_patterns_user_id', 'behavioral_patterns', ['user_id'])
    op.create_index('ix_behavioral_patterns_type', 'behavioral_patterns', ['pattern_type'])

    # Create ai_coaching_log table
    op.create_table(
        'ai_coaching_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=True),
        sa.Column('coaching_type', sa.Enum('encouragement', 'correction', 'suggestion', 'question', 'insight', name='coaching_type'), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('user_response', sa.Text(), nullable=True),
        sa.Column('response_type', sa.Enum('accepted', 'declined', 'modified', 'ignored', name='response_type'), nullable=True),
        sa.Column('context', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['session_id'], ['workout_sessions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_ai_coaching_log_user_id', 'ai_coaching_log', ['user_id'])
    op.create_index('ix_ai_coaching_log_session_id', 'ai_coaching_log', ['session_id'])


def downgrade():
    op.drop_index('ix_ai_coaching_log_session_id', table_name='ai_coaching_log')
    op.drop_index('ix_ai_coaching_log_user_id', table_name='ai_coaching_log')
    op.drop_table('ai_coaching_log')

    op.drop_index('ix_behavioral_patterns_type', table_name='behavioral_patterns')
    op.drop_index('ix_behavioral_patterns_user_id', table_name='behavioral_patterns')
    op.drop_table('behavioral_patterns')

    # Drop enums
    op.execute('DROP TYPE IF EXISTS response_type')
    op.execute('DROP TYPE IF EXISTS coaching_type')
    op.execute('DROP TYPE IF EXISTS pattern_type')

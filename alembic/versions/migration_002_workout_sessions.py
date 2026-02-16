"""create workout sessions and exercise logs

Revision ID: 002_workout_sessions
Revises: 001_user_state
Create Date: 2026-02-17

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '002_workout_sessions'
down_revision = '001_user_state'
branch_labels = None
depends_on = None


def upgrade():
    # Create workout_sessions table
    op.create_table(
        'workout_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('workout_program_id', sa.Integer(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.Enum('in_progress', 'completed', 'abandoned', name='session_status'), nullable=False),
        sa.Column('total_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('ai_feedback', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['workout_program_id'], ['manual_workouts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_workout_sessions_user_id', 'workout_sessions', ['user_id'])
    op.create_index('ix_workout_sessions_status', 'workout_sessions', ['status'])

    # Create exercise_logs table
    op.create_table(
        'exercise_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('exercise_name', sa.String(255), nullable=False),
        sa.Column('exercise_order', sa.Integer(), nullable=False),

        # Planned vs Actual
        sa.Column('planned_sets', sa.Integer(), nullable=True),
        sa.Column('completed_sets', sa.Integer(), nullable=True),
        sa.Column('planned_reps', sa.Integer(), nullable=True),
        sa.Column('actual_reps', sa.Integer(), nullable=True),
        sa.Column('planned_weight', sa.Float(), nullable=True),
        sa.Column('actual_weight', sa.Float(), nullable=True),

        # Timing
        sa.Column('rest_time_seconds', sa.Integer(), nullable=True),
        sa.Column('expected_duration_seconds', sa.Integer(), nullable=True),
        sa.Column('actual_duration_seconds', sa.Integer(), nullable=True),

        # Quality & Notes
        sa.Column('deviation_reason', sa.Text(), nullable=True),
        sa.Column('form_quality', sa.Enum('excellent', 'good', 'needs_work', 'poor', name='form_quality'), nullable=True),
        sa.Column('user_notes', sa.Text(), nullable=True),
        sa.Column('ai_suggestions', sa.Text(), nullable=True),
        sa.Column('rpe', sa.Integer(), nullable=True),  # Rate of Perceived Exertion 1-10

        sa.Column('logged_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['workout_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_exercise_logs_session_id', 'exercise_logs', ['session_id'])


def downgrade():
    op.drop_index('ix_exercise_logs_session_id', table_name='exercise_logs')
    op.drop_table('exercise_logs')

    op.drop_index('ix_workout_sessions_status', table_name='workout_sessions')
    op.drop_index('ix_workout_sessions_user_id', table_name='workout_sessions')
    op.drop_table('workout_sessions')

    # Drop enums (PostgreSQL specific)
    op.execute('DROP TYPE IF EXISTS form_quality')
    op.execute('DROP TYPE IF EXISTS session_status')

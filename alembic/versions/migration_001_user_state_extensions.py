"""add user state tracking

Revision ID: 001_user_state
Revises:
Create Date: 2026-02-17

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_user_state'
down_revision = '2bf24b7a9778'  
branch_labels = None
depends_on = None


def upgrade():
    # Add columns to users table for tracking active programs
    op.add_column('users', sa.Column('active_workout_program_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('active_diet_plan_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('onboarding_completed', sa.Boolean(), nullable=False, server_default='false'))

    # Add foreign key constraints (we'll add these after creating the tables)
    # op.create_foreign_key('fk_users_active_workout', 'users', 'manual_workouts', ['active_workout_program_id'], ['id'])
    # op.create_foreign_key('fk_users_active_diet', 'users', 'diet_plans', ['active_diet_plan_id'], ['id'])


def downgrade():
    # Remove columns
    op.drop_column('users', 'onboarding_completed')
    op.drop_column('users', 'active_diet_plan_id')
    op.drop_column('users', 'active_workout_program_id')

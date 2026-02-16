"""create meal logs, food preferences, and eating patterns

Revision ID: 005_meal_logging
Revises: 004_diet_system
Create Date: 2026-02-17

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005_meal_logging'
down_revision = '004_diet_system'
branch_labels = None
depends_on = None


def upgrade():
    # Create meal_logs table
    op.create_table(
        'meal_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('diet_plan_id', sa.Integer(), nullable=False),
        sa.Column('meal_template_id', sa.Integer(), nullable=True),

        # When
        sa.Column('logged_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('planned_time', sa.Time(), nullable=True),
        sa.Column('actual_time', sa.Time(), nullable=True),
        sa.Column('time_deviation_minutes', sa.Integer(), nullable=True),

        # What
        sa.Column('foods_eaten', sa.JSON(), nullable=False),

        # Adherence
        sa.Column('followed_plan', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('deviation_reason', sa.Text(), nullable=True),

        # Totals
        sa.Column('total_calories', sa.Integer(), nullable=False),
        sa.Column('total_protein', sa.Float(), nullable=False),
        sa.Column('total_carbs', sa.Float(), nullable=False),
        sa.Column('total_fats', sa.Float(), nullable=False),

        # Context
        sa.Column('energy_level', sa.Enum('very_low', 'low', 'normal', 'high', 'very_high', name='energy_level'), nullable=True),
        sa.Column('hunger_level', sa.Enum('not_hungry', 'slightly', 'hungry', 'very_hungry', 'starving', name='hunger_level'), nullable=True),
        sa.Column('mood', sa.Enum('poor', 'okay', 'good', 'great', 'excellent', name='mood'), nullable=True),

        # Post-meal
        sa.Column('satisfaction_rating', sa.Integer(), nullable=True),
        sa.Column('too_much', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('too_little', sa.Boolean(), nullable=False, server_default='false'),

        # AI Context
        sa.Column('workout_before', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('workout_after', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('ai_suggestion_followed', sa.Boolean(), nullable=True),
        sa.Column('ai_feedback', sa.Text(), nullable=True),

        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['diet_plan_id'], ['diet_plans.id'], ),
        sa.ForeignKeyConstraint(['meal_template_id'], ['meal_templates.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_meal_logs_user_id', 'meal_logs', ['user_id'])
    op.create_index('ix_meal_logs_logged_at', 'meal_logs', ['logged_at'])

    # Create food_preferences table
    op.create_table(
        'food_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),

        # Food
        sa.Column('food_name', sa.String(255), nullable=False),
        sa.Column('food_category', sa.String(100), nullable=True),

        # Preference Data
        sa.Column('times_eaten', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('times_chosen_when_alternative', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('avg_satisfaction_rating', sa.Float(), nullable=True),

        # Context
        sa.Column('preferred_meal_time', sa.Enum('breakfast', 'lunch', 'dinner', 'snack', name='meal_time'), nullable=True),
        sa.Column('preferred_on_workout_days', sa.Boolean(), nullable=True),
        sa.Column('preferred_on_rest_days', sa.Boolean(), nullable=True),

        # Patterns
        sa.Column('energy_correlation', sa.Float(), nullable=True),
        sa.Column('mood_correlation', sa.Float(), nullable=True),
        sa.Column('workout_performance_correlation', sa.Float(), nullable=True),

        # Learning
        sa.Column('confidence_score', sa.Float(), nullable=False, server_default='0.5'),
        sa.Column('first_observed', sa.DateTime(), nullable=False),
        sa.Column('last_observed', sa.DateTime(), nullable=False),

        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'food_name', name='uq_user_food')
    )
    op.create_index('ix_food_preferences_user_id', 'food_preferences', ['user_id'])

    # Create eating_patterns table
    op.create_table(
        'eating_patterns',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),

        # Pattern Type
        sa.Column('pattern_type', sa.Enum('timing', 'quantity', 'preference', 'adherence', 'energy', name='eating_pattern_type'), nullable=False),

        # Details
        sa.Column('observation', sa.Text(), nullable=False),
        sa.Column('context', sa.Text(), nullable=True),

        # Data
        sa.Column('occurrence_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('confidence_score', sa.Float(), nullable=False, server_default='0.5'),

        # Timing
        sa.Column('first_observed', sa.DateTime(), nullable=False),
        sa.Column('last_observed', sa.DateTime(), nullable=False),

        # AI Interpretation
        sa.Column('ai_interpretation', sa.Text(), nullable=True),
        sa.Column('recommended_action', sa.Text(), nullable=True),

        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_eating_patterns_user_id', 'eating_patterns', ['user_id'])


def downgrade():
    op.drop_index('ix_eating_patterns_user_id', table_name='eating_patterns')
    op.drop_table('eating_patterns')

    op.drop_index('ix_food_preferences_user_id', table_name='food_preferences')
    op.drop_table('food_preferences')

    op.drop_index('ix_meal_logs_logged_at', table_name='meal_logs')
    op.drop_index('ix_meal_logs_user_id', table_name='meal_logs')
    op.drop_table('meal_logs')

    # Drop enums
    op.execute('DROP TYPE IF EXISTS eating_pattern_type')
    op.execute('DROP TYPE IF EXISTS meal_time')
    op.execute('DROP TYPE IF EXISTS mood')
    op.execute('DROP TYPE IF EXISTS hunger_level')
    op.execute('DROP TYPE IF EXISTS energy_level')

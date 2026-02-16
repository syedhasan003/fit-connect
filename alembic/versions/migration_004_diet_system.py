"""create diet plans, meal templates, and meal foods

Revision ID: 004_diet_system
Revises: 003_behavioral_patterns
Create Date: 2026-02-17

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004_diet_system'
down_revision = '003_behavioral_patterns'
branch_labels = None
depends_on = None


def upgrade():
    # Create diet_plans table
    op.create_table(
        'diet_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),

        # Goals
        sa.Column('goal_type', sa.Enum('maintain', 'cut', 'bulk', name='goal_type'), nullable=False),
        sa.Column('target_calories', sa.Integer(), nullable=False),
        sa.Column('target_protein', sa.Integer(), nullable=False),
        sa.Column('target_carbs', sa.Integer(), nullable=False),
        sa.Column('target_fats', sa.Integer(), nullable=False),

        # Structure
        sa.Column('meals_per_day', sa.Integer(), nullable=False, server_default='3'),

        # Status
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_by', sa.Enum('user', 'ai', name='created_by'), nullable=False, server_default='user'),

        # AI Context
        sa.Column('workout_intensity_factor', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('last_ai_adjustment', sa.DateTime(), nullable=True),
        sa.Column('adjustment_reason', sa.Text(), nullable=True),

        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_diet_plans_user_id', 'diet_plans', ['user_id'])
    op.create_index('ix_diet_plans_is_active', 'diet_plans', ['is_active'])

    # Create meal_templates table
    op.create_table(
        'meal_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('diet_plan_id', sa.Integer(), nullable=False),

        # Meal Info
        sa.Column('meal_number', sa.Integer(), nullable=False),
        sa.Column('meal_name', sa.String(255), nullable=True),
        sa.Column('target_time', sa.Time(), nullable=True),

        # Macros
        sa.Column('calories', sa.Integer(), nullable=True),
        sa.Column('protein', sa.Integer(), nullable=True),
        sa.Column('carbs', sa.Integer(), nullable=True),
        sa.Column('fats', sa.Integer(), nullable=True),

        # Flexibility
        sa.Column('is_flexible', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('alternatives', sa.JSON(), nullable=True),

        sa.ForeignKeyConstraint(['diet_plan_id'], ['diet_plans.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_meal_templates_diet_plan_id', 'meal_templates', ['diet_plan_id'])

    # Create meal_foods table
    op.create_table(
        'meal_foods',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('meal_template_id', sa.Integer(), nullable=False),

        # Food Info
        sa.Column('food_name', sa.String(255), nullable=False),
        sa.Column('food_category', sa.Enum('protein', 'carb', 'fat', 'vegetable', 'fruit', 'supplement', 'other', name='food_category'), nullable=True),

        # Quantity
        sa.Column('serving_size', sa.String(100), nullable=True),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(50), nullable=False),

        # Nutrition per serving
        sa.Column('calories_per_serving', sa.Integer(), nullable=False),
        sa.Column('protein_per_serving', sa.Float(), nullable=False),
        sa.Column('carbs_per_serving', sa.Float(), nullable=False),
        sa.Column('fats_per_serving', sa.Float(), nullable=False),

        # Preferences
        sa.Column('is_preferred', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('user_rating', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),

        sa.ForeignKeyConstraint(['meal_template_id'], ['meal_templates.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_meal_foods_meal_template_id', 'meal_foods', ['meal_template_id'])


def downgrade():
    op.drop_index('ix_meal_foods_meal_template_id', table_name='meal_foods')
    op.drop_table('meal_foods')

    op.drop_index('ix_meal_templates_diet_plan_id', table_name='meal_templates')
    op.drop_table('meal_templates')

    op.drop_index('ix_diet_plans_is_active', table_name='diet_plans')
    op.drop_index('ix_diet_plans_user_id', table_name='diet_plans')
    op.drop_table('diet_plans')

    # Drop enums
    op.execute('DROP TYPE IF EXISTS food_category')
    op.execute('DROP TYPE IF EXISTS created_by')
    op.execute('DROP TYPE IF EXISTS goal_type')

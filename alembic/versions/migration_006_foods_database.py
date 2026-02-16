"""create foods database for search

Revision ID: 006_foods_database
Revises: 005_meal_logging
Create Date: 2026-02-17

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '006_foods_database'
down_revision = '005_meal_logging'
branch_labels = None
depends_on = None


def upgrade():
    # Create foods table for searchable food database
    op.create_table(
        'foods',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('brand', sa.String(255), nullable=True),
        sa.Column('category', sa.String(100), nullable=True),

        # Nutrition per 100g
        sa.Column('calories_per_100g', sa.Integer(), nullable=False),
        sa.Column('protein_per_100g', sa.Float(), nullable=False),
        sa.Column('carbs_per_100g', sa.Float(), nullable=False),
        sa.Column('fats_per_100g', sa.Float(), nullable=False),
        sa.Column('fiber_per_100g', sa.Float(), nullable=True),

        # Common serving sizes
        sa.Column('common_serving', sa.String(100), nullable=True),
        sa.Column('common_serving_grams', sa.Float(), nullable=True),

        # Metadata
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('source', sa.Enum('seeded', 'api', 'user_custom', name='food_source'), nullable=False, server_default='seeded'),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('times_used', sa.Integer(), nullable=False, server_default='0'),

        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),

        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_foods_name', 'foods', ['name'])
    op.create_index('ix_foods_category', 'foods', ['category'])
    op.create_index('ix_foods_source', 'foods', ['source'])
    op.create_index('ix_foods_user_id', 'foods', ['user_id'])

    # Full-text search index (PostgreSQL specific)
    # op.execute("CREATE INDEX ix_foods_name_trgm ON foods USING gin (name gin_trgm_ops)")


def downgrade():
    # op.execute("DROP INDEX IF EXISTS ix_foods_name_trgm")
    op.drop_index('ix_foods_user_id', table_name='foods')
    op.drop_index('ix_foods_source', table_name='foods')
    op.drop_index('ix_foods_category', table_name='foods')
    op.drop_index('ix_foods_name', table_name='foods')
    op.drop_table('foods')

    op.execute('DROP TYPE IF EXISTS food_source')

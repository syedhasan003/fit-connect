from alembic import op
import sqlalchemy as sa

revision = "148ef2e81f98"
down_revision = "e994997769f2"
branch_labels = None
depends_on = None


def upgrade():
    # Drop old table created with memory_data
    op.drop_table("health_memories", if_exists=True)

    # Final authoritative schema
    op.create_table(
        "health_memories",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("category", sa.String, nullable=False),  # workout | nutrition | ai_insight
        sa.Column("source", sa.String, nullable=False, server_default="ai"),
        sa.Column("content", sa.JSON, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_index(
        "ix_health_memories_user_id",
        "health_memories",
        ["user_id"],
    )


def downgrade():
    op.drop_table("health_memories")

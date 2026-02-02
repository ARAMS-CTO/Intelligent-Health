"""enable_pgvector_and_embeddings

Revision ID: 52618744fa9f
Revises: 
Create Date: 2026-01-31 00:24:59.824706

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '52618744fa9f'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    
    # Create embeddings table
    # Using raw SQL to ensure vector type is handled correctly without extra python dependencies during migration generation
    op.execute("""
        CREATE TABLE IF NOT EXISTS embeddings (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            content TEXT NOT NULL,
            metadata JSONB,
            embedding vector(768),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create Index for IVFFlat (Approximate Nearest Neighbor)
    # Lists = 100 is a good default for < 100k rows
    op.execute("CREATE INDEX IF NOT EXISTS embedding_idx ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP INDEX IF EXISTS embedding_idx")
    op.execute("DROP TABLE IF EXISTS embeddings")
    op.execute("DROP EXTENSION IF EXISTS vector")

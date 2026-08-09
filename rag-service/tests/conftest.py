import pytest

from app.config import Settings


@pytest.fixture
def settings() -> Settings:
    return Settings(
        anthropic_api_key="test-anthropic-key",
        supabase_db_url="postgresql://test:test@localhost:5432/test",
        rag_service_api_key="test-shared-secret",
    )

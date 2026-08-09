from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str
    supabase_db_url: str
    rag_service_api_key: str

    rag_rewrite_model: str = "claude-haiku-4-5-20251001"
    rag_generation_model: str = "claude-sonnet-5"
    rag_context_summary_model: str = "claude-haiku-4-5-20251001"

    embedding_model_name: str = "all-MiniLM-L6-v2"
    reranker_model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"

    chunk_size: int = 800
    chunk_overlap: int = 100

    retrieval_top_k: int = 5
    rerank_score_floor: float = 0.0


def get_settings() -> Settings:
    return Settings()

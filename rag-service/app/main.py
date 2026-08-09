import logging

from anthropic import Anthropic
from fastapi import Depends, FastAPI
from fastapi.responses import JSONResponse
from sentence_transformers import CrossEncoder, SentenceTransformer

from app.auth import require_api_key
from app.config import Settings, get_settings
from app.db.vectorstore import get_connection
from app.pipeline.answer_service import answer_question
from app.schemas import AnswerRequest, AnswerResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rag_service")

app = FastAPI(title="Landline RAG Service")

_embedder: SentenceTransformer | None = None
_cross_encoder: CrossEncoder | None = None


def get_embedder(settings: Settings = Depends(get_settings)) -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(settings.embedding_model_name)
    return _embedder


def get_cross_encoder(settings: Settings = Depends(get_settings)) -> CrossEncoder:
    global _cross_encoder
    if _cross_encoder is None:
        _cross_encoder = CrossEncoder(settings.reranker_model_name)
    return _cross_encoder


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/rag/answer", response_model=AnswerResponse, dependencies=[Depends(require_api_key)])
def rag_answer(
    request: AnswerRequest,
    settings: Settings = Depends(get_settings),
    embedder: SentenceTransformer = Depends(get_embedder),
    cross_encoder: CrossEncoder = Depends(get_cross_encoder),
) -> AnswerResponse | JSONResponse:
    anthropic_client = Anthropic(api_key=settings.anthropic_api_key)

    try:
        conn = get_connection(settings)
    except Exception:
        logger.exception("Failed to connect to the database")
        return JSONResponse(status_code=502, content={"error": "Upstream dependency unavailable"})

    try:
        return answer_question(
            conn=conn,
            anthropic_client=anthropic_client,
            embedder=embedder,
            cross_encoder=cross_encoder,
            settings=settings,
            question=request.question,
        )
    except Exception:
        logger.exception("RAG pipeline failed for question=%r", request.question)
        return JSONResponse(status_code=502, content={"error": "Upstream dependency unavailable"})
    finally:
        conn.close()

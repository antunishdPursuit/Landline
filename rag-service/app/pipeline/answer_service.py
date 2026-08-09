import logging

from anthropic import Anthropic
from sentence_transformers import CrossEncoder, SentenceTransformer

from app.config import Settings
from app.pipeline.generation import generate_grounded_answer
from app.pipeline.query_rewrite import rewrite_query
from app.pipeline.reranker import rerank
from app.pipeline.retrieval import retrieve_candidates
from app.schemas import AnswerResponse, Source

logger = logging.getLogger("rag_service.answer")


def answer_question(
    conn,
    anthropic_client: Anthropic,
    embedder: SentenceTransformer,
    cross_encoder: CrossEncoder,
    settings: Settings,
    question: str,
) -> AnswerResponse:
    rewritten_query = rewrite_query(anthropic_client, settings, question)

    candidates = retrieve_candidates(conn, embedder, settings, rewritten_query)
    ranked = rerank(cross_encoder, rewritten_query, candidates)

    if not ranked or ranked[0][1] < settings.rerank_score_floor:
        logger.info(
            "cannot_answer question=%r rewritten=%r reason=below_rerank_floor",
            question,
            rewritten_query,
        )
        return AnswerResponse(
            answered=False,
            answer=None,
            sources=[],
            query_used=rewritten_query,
            reason="no_supporting_content",
        )

    answer_text, used_indices = generate_grounded_answer(
        anthropic_client, settings, question, ranked
    )

    if answer_text is None:
        logger.info(
            "cannot_answer question=%r rewritten=%r reason=no_grounded_citation",
            question,
            rewritten_query,
        )
        return AnswerResponse(
            answered=False,
            answer=None,
            sources=[],
            query_used=rewritten_query,
            reason="no_supporting_content",
        )

    sources = [
        Source(
            title=ranked[i][0].title,
            document_id=ranked[i][0].document_id,
            excerpt=ranked[i][0].raw_content,
        )
        for i in used_indices
        if 0 <= i < len(ranked)
    ]

    logger.info(
        "answered question=%r rewritten=%r top_chunk_ids=%s",
        question,
        rewritten_query,
        [ranked[i][0].chunk_id for i in used_indices if 0 <= i < len(ranked)],
    )

    return AnswerResponse(
        answered=True,
        answer=answer_text,
        sources=sources,
        query_used=rewritten_query,
    )

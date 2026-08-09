"""Anthropic "contextual retrieval" pattern: prepend a short LLM-generated
summary of where a chunk came from before it gets embedded, so the embedding
carries document-level context a bare chunk would lose.
"""
from anthropic import Anthropic

from app.config import Settings

_SYSTEM_PROMPT = (
    "You write a single short sentence (max 30 words) giving context for a "
    "text chunk: what document it's from and what topic it covers. "
    "Do not restate the chunk's content verbatim, just situate it. "
    "Respond with only the sentence, no preamble."
)


def generate_context_summary(
    client: Anthropic, settings: Settings, document_title: str, chunk_text: str
) -> str:
    message = client.messages.create(
        model=settings.rag_context_summary_model,
        max_tokens=100,
        system=_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Document title: {document_title}\n\n"
                    f"Chunk:\n{chunk_text}"
                ),
            }
        ],
    )
    return message.content[0].text.strip()


def build_embedded_content(context_summary: str, raw_chunk: str) -> str:
    return f"{context_summary}\n\n{raw_chunk}"

from anthropic import Anthropic

from app.config import Settings

_SYSTEM_PROMPT = (
    "You rewrite a guest's spoken question into a short, keyword-dense query "
    "optimized for similarity search against a hotel FAQ knowledge base. "
    "Preserve the original meaning, drop filler words, expand obvious "
    "abbreviations. Respond with only the rewritten query, no preamble."
)


def rewrite_query(client: Anthropic, settings: Settings, question: str) -> str:
    message = client.messages.create(
        model=settings.rag_rewrite_model,
        max_tokens=60,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": question}],
    )
    rewritten = message.content[0].text.strip()
    return rewritten or question

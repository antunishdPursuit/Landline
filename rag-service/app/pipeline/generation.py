from anthropic import Anthropic

from app.config import Settings
from app.db.vectorstore import ChunkMatch

NO_ANSWER_SENTINEL = "NO_ANSWER_IN_CONTEXT"

_SYSTEM_PROMPT = f"""You are a hotel front-desk assistant. Answer the guest's
question using ONLY the numbered source chunks provided below. Never use
outside knowledge, and never guess.

Rules:
- If the sources fully or partially support an answer, answer concisely and
  end your response with a line listing which source numbers you used, in
  the exact form: SOURCES: [1, 3]
- If none of the sources contain information that answers the question,
  respond with exactly: {NO_ANSWER_SENTINEL}
- Do not fabricate any fact not present in the sources.
"""


def generate_grounded_answer(
    client: Anthropic, settings: Settings, question: str, ranked_chunks: list[tuple[ChunkMatch, float]]
) -> tuple[str | None, list[int]]:
    """Returns (answer_text_or_None, list_of_used_source_indices).

    An empty used-source list (or None answer) means "cannot answer".
    """
    if not ranked_chunks:
        return None, []

    numbered_sources = "\n\n".join(
        f"[{i + 1}] {chunk.raw_content}" for i, (chunk, _score) in enumerate(ranked_chunks)
    )

    message = client.messages.create(
        model=settings.rag_generation_model,
        max_tokens=500,
        system=_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Sources:\n{numbered_sources}\n\nQuestion: {question}",
            }
        ],
    )
    raw_text = message.content[0].text.strip()

    if NO_ANSWER_SENTINEL in raw_text:
        return None, []

    used_indices: list[int] = []
    answer_lines = []
    for line in raw_text.splitlines():
        if line.strip().upper().startswith("SOURCES:"):
            bracket_content = line.split(":", 1)[1].strip().strip("[]")
            for token in bracket_content.split(","):
                token = token.strip()
                if token.isdigit():
                    used_indices.append(int(token) - 1)
        else:
            answer_lines.append(line)

    answer_text = "\n".join(answer_lines).strip()

    if not answer_text or not used_indices:
        return None, []

    return answer_text, used_indices

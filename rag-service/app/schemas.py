from pydantic import BaseModel, field_validator


class AnswerRequest(BaseModel):
    question: str
    room_number: str | None = None

    @field_validator("question")
    @classmethod
    def question_not_blank(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("question must not be empty")
        return value.strip()


class Source(BaseModel):
    title: str
    document_id: str
    excerpt: str


class AnswerResponse(BaseModel):
    answered: bool
    answer: str | None
    sources: list[Source]
    query_used: str | None = None
    reason: str | None = None

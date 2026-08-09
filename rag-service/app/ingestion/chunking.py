from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import Settings


def split_document(text: str, settings: Settings) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )
    return splitter.split_text(text)

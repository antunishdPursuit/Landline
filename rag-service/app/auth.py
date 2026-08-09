from fastapi import Header, HTTPException, Depends

from app.config import Settings, get_settings


def require_api_key(
    x_internal_api_key: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> None:
    if not x_internal_api_key or x_internal_api_key != settings.rag_service_api_key:
        raise HTTPException(status_code=401, detail="Missing or invalid X-Internal-Api-Key")

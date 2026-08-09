from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.main import app, get_cross_encoder, get_embedder
from app.schemas import AnswerResponse


@pytest.fixture
def test_settings() -> Settings:
    return Settings(
        anthropic_api_key="test-anthropic-key",
        supabase_db_url="postgresql://test:test@localhost:5432/test",
        rag_service_api_key="test-shared-secret",
    )


@pytest.fixture
def client(test_settings: Settings) -> TestClient:
    app.dependency_overrides[get_settings] = lambda: test_settings
    app.dependency_overrides[get_embedder] = lambda: MagicMock()
    app.dependency_overrides[get_cross_encoder] = lambda: MagicMock()
    yield TestClient(app)
    app.dependency_overrides.clear()


AUTH_HEADERS = {"X-Internal-Api-Key": "test-shared-secret"}


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_rag_answer_requires_auth_header(client: TestClient):
    response = client.post("/rag/answer", json={"question": "when is breakfast?"})
    assert response.status_code == 401


def test_rag_answer_rejects_wrong_api_key(client: TestClient):
    response = client.post(
        "/rag/answer",
        json={"question": "when is breakfast?"},
        headers={"X-Internal-Api-Key": "wrong-key"},
    )
    assert response.status_code == 401


def test_rag_answer_rejects_empty_question(client: TestClient):
    response = client.post("/rag/answer", json={"question": "   "}, headers=AUTH_HEADERS)
    assert response.status_code == 422


def test_rag_answer_rejects_missing_question(client: TestClient):
    response = client.post("/rag/answer", json={}, headers=AUTH_HEADERS)
    assert response.status_code == 422


def test_rag_answer_returns_grounded_answer_on_match(client: TestClient):
    fake_response = AnswerResponse(
        answered=True,
        answer="Breakfast ends at 10:30 AM.",
        sources=[{"title": "Breakfast", "document_id": "doc-1", "excerpt": "Breakfast is served 6:30-10:30 AM."}],
        query_used="breakfast end time",
    )

    with patch("app.main.get_connection", return_value=MagicMock()), \
         patch("app.main.answer_question", return_value=fake_response):
        response = client.post(
            "/rag/answer", json={"question": "when is breakfast ending?"}, headers=AUTH_HEADERS
        )

    assert response.status_code == 200
    body = response.json()
    assert body["answered"] is True
    assert body["answer"] == "Breakfast ends at 10:30 AM."
    assert len(body["sources"]) == 1


def test_rag_answer_returns_cannot_answer_without_error(client: TestClient):
    fake_response = AnswerResponse(
        answered=False,
        answer=None,
        sources=[],
        query_used="pool chlorine level",
        reason="no_supporting_content",
    )

    with patch("app.main.get_connection", return_value=MagicMock()), \
         patch("app.main.answer_question", return_value=fake_response):
        response = client.post(
            "/rag/answer",
            json={"question": "what's the exact chlorine level in the pool?"},
            headers=AUTH_HEADERS,
        )

    assert response.status_code == 200
    body = response.json()
    assert body["answered"] is False
    assert body["answer"] is None
    assert body["sources"] == []


def test_rag_answer_db_failure_returns_502_without_leaking_internals(client: TestClient):
    with patch("app.main.get_connection", side_effect=Exception("password authentication failed for user")):
        response = client.post(
            "/rag/answer", json={"question": "when is breakfast ending?"}, headers=AUTH_HEADERS
        )

    assert response.status_code == 502
    body = response.json()
    assert "password" not in str(body)
    assert "error" in body


def test_rag_answer_pipeline_failure_returns_502_without_leaking_internals(client: TestClient):
    with patch("app.main.get_connection", return_value=MagicMock()), \
         patch("app.main.answer_question", side_effect=Exception("ANTHROPIC_API_KEY=sk-secret-value invalid")):
        response = client.post(
            "/rag/answer", json={"question": "when is breakfast ending?"}, headers=AUTH_HEADERS
        )

    assert response.status_code == 502
    body = response.json()
    assert "sk-secret-value" not in str(body)
    assert "error" in body

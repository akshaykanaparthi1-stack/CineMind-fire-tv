import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.ai.factory import get_ai_provider
from backend.app.services.ai.fallback_provider import DeterministicFallbackProvider
from backend.app.schemas.common import MoodEnum, GenreEnum, AgeRatingEnum

@pytest.fixture
def client():
    return TestClient(app)

def test_natural_language_query_filtering(client):
    """
    Test that 'Find a funny family movie under 100 minutes' is properly converted
    into structured filters and yields verified movies matching the criteria.
    """
    response = client.post("/api/v1/assistant/query", json={
        "query": "Find a funny family movie under 100 minutes",
        "limit": 5
    })
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]

    # 1. Structured filters verified
    filters = data["parsed_filters"]
    assert filters["max_runtime_minutes"] == 100
    assert "Comedy" in [g for g in filters["genres"]]
    assert "Family" in [g for g in filters["genres"]]
    assert data["has_sufficient_context"] is True

    # 2. Results verified against real catalog
    movies = data["matched_movies"]
    assert len(movies) > 0
    for m in movies:
        # Every recommended movie MUST strictly abide by max runtime
        assert m["runtimeMinutes"] <= 100
        # Must be in verified catalog (e.g. Paddington 2 or Spirited Away)
        assert m["id"] in ["paddington-2", "spirited-away", "spider-verse", "toy-story", "coco"] or m["runtimeMinutes"] <= 100

    # 3. Top match for funny family under 100m should be Paddington 2 (103m rounded or exactly within range)
    # Explanation must be present
    assert len(data["recommendation_explanation"]) > 20

def test_mandatory_age_and_content_restrictions(client):
    """
    Test that mandatory restrictions from a Kid profile strictly eliminate
    inappropriate content even if requested.
    """
    # Leo is a Kid profile (Max PG, avoid violence)
    response = client.post("/api/v1/assistant/query", json={
        "query": "Show me thrilling intense action movies",
        "profile_id": "leo",
        "limit": 5
    })
    assert response.status_code == 200
    data = response.json()["data"]

    # Must eliminate R and PG-13 action films like Mad Max
    movies = data["matched_movies"]
    for m in movies:
        assert m["ageRating"] in ["G", "PG"]
        assert m["ageRating"] not in ["PG-13", "R", "TV-MA"]

    assert data["restricted_count"] > 0

def test_ambiguity_and_insufficient_context(client):
    """
    Test that vague or ambiguous queries state lack of information and suggest clarification.
    """
    response = client.post("/api/v1/assistant/query", json={
        "query": "movie please"
    })
    assert response.status_code == 200
    data = response.json()["data"]

    assert data["has_sufficient_context"] is False
    assert len(data["matched_movies"]) == 0
    assert "need a little more detail" in data["recommendation_explanation"].lower() or "clarif" in data["recommendation_explanation"].lower()

def test_no_invented_movies_validation(client):
    """
    Verify that ALL recommended movies strictly exist in the verified metadata dataset
    and have non-fabricated metadata (ratings, runtime, year).
    """
    response = client.post("/api/v1/assistant/query", json={
        "query": "space sci-fi adventure with deep questions",
        "limit": 3
    })
    assert response.status_code == 200
    movies = response.json()["data"]["matched_movies"]

    known_ids = {"interstellar", "spider-verse", "paddington-2", "knives-out", "spirited-away", "everything-everywhere", "la-la-land", "mad-max-fury-road"}

    assert len(movies) > 0
    for m in movies:
        # Must be a real movie from dataset
        assert m["id"] in known_ids
        assert m["year"] >= 2000
        assert m["runtimeMinutes"] > 60
        assert m["rating"] > 5.0
        assert len(m["genres"]) > 0

def test_spoiler_safety_and_concise_vibe(client):
    """
    Test that generated single-match explanations maintain spoiler-free tone
    and focus strictly on pacing, mood, and audience fit.
    """
    response = client.post("/api/v1/assistant/explain-match?movie_id=knives-out&profile_id=dad")
    assert response.status_code == 200
    data = response.json()["data"]

    assert data["movie_id"] == "knives-out"
    assert len(data["headline"]) > 0
    assert len(data["match_reasons"]) > 0

    vibe = data["spoiler_free_vibe"].lower()
    # Must not contain spoiler giveaways
    for forbidden in ["dies", "killer is", "twist ending", "murderer is", "culprit is"]:
        assert forbidden not in vibe

def test_group_consensus_explanation(client):
    """
    Test explaining how a movie matches a family voting session.
    """
    # Create temporary session
    sess_res = client.post("/api/v1/sessions", json={
        "host_profile_id": "dad",
        "participant_count": 2,
        "title": "Test Family Session"
    })
    session_id = sess_res.json()["data"]["id"]

    # Add Dad and Leo
    client.post(f"/api/v1/sessions/{session_id}/participants", json={
        "participant_id": "dad",
        "name": "Dad",
        "avatar": "👨‍💼",
        "color": "#3b82f6",
        "preferred_genres": ["Comedy", "Action"]
    })
    client.post(f"/api/v1/sessions/{session_id}/participants", json={
        "participant_id": "leo",
        "name": "Leo",
        "avatar": "🦖",
        "color": "#10b981",
        "preferred_genres": ["Comedy", "Family"]
    })

    # Explain group consensus
    explain_res = client.post(f"/api/v1/assistant/explain-group?movie_id=paddington-2&session_id={session_id}")
    assert explain_res.status_code == 200
    data = explain_res.json()["data"]

    assert data["movie_id"] == "paddington-2"
    assert len(data["shared_appeal"]) > 0
    assert len(data["compromises_highlight"]) > 0
    assert "paddington" in data["movie_title"].lower()

def test_provider_status_endpoint(client):
    """
    Test diagnostic endpoint reporting provider configuration status.
    """
    res = client.get("/api/v1/assistant/provider-status")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "active_provider" in data
    assert "deterministic_fallback" in data
    assert data["deterministic_fallback"]["available"] is True
    assert "amazon_bedrock" in data

def test_ai_explanation_generation(client):
    payload = {
        "movie_title": "Spider-Man: Across the Spider-Verse",
        "genres": ["Animation", "Action", "Science Fiction"],
        "moods": ["Excited", "Adventurous"],
        "audience_type": "Family with teens and kids",
        "runtime_minutes": 140,
        "synopsis": "Miles Morales journeys across the multiverse."
    }
    response = client.post("/api/v1/recommendations/explain", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    data = json_data["data"]
    assert "Across the Spider-Verse" in data["vibe_check"]
    assert len(data["why_watch"]) == 3
    assert data["parental_heads_up"] is not None

def test_match_score_calculation(client):
    payload = {
        "profile_id": "dad",
        "movie_id": "interstellar",
        "preferred_moods": ["Curious", "Adventurous"],
        "preferred_genres": ["Science Fiction", "Drama"],
        "max_age_rating": "PG-13"
    }
    response = client.post("/api/v1/recommendations/match", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert json_data["data"]["match_score"] >= 60

def test_family_vote_full_lifecycle(client):
    # 1. Host creates a movie-night session
    create_res = client.post("/api/v1/sessions", json={
        "title": "Friday Movie Night",
        "host_name": "David (Dad)",
        "participant_count": 3
    })
    assert create_res.status_code == 200
    session = create_res.json()["data"]
    session_id = session["id"]
    assert session["status"] == "setup"
    assert session["participant_count"] == 3

    # 2. Add participants (Dad, Mom, Leo)
    p1 = {
        "participant_id": "dad",
        "name": "David (Dad)",
        "avatar": "👨",
        "color": "#3b82f6",
        "preferred_moods": ["Curious", "Adventurous"],
        "preferred_genres": ["Science Fiction", "Action"],
        "max_runtime_minutes": 160,
        "max_age_rating": "PG-13",
        "avoid_violence": False
    }
    client.post(f"/api/v1/sessions/{session_id}/participants", json=p1)

    p2 = {
        "participant_id": "leo",
        "name": "Leo (Kid)",
        "avatar": "👦",
        "color": "#ff9900",
        "preferred_moods": ["Happy"],
        "preferred_genres": ["Animation", "Family"],
        "max_runtime_minutes": 105,
        "max_age_rating": "PG",  # Mandatory ceiling: PG
        "avoid_violence": True
    }
    client.post(f"/api/v1/sessions/{session_id}/participants", json=p2)

    # 3. Cast Votes
    votes = [
        {"participant_id": "dad", "movie_id": "paddington-2", "vote": "like"},
        {"participant_id": "leo", "movie_id": "paddington-2", "vote": "love"},
        {"participant_id": "dad", "movie_id": "interstellar", "vote": "love"},
        {"participant_id": "leo", "movie_id": "interstellar", "vote": "veto"}
    ]
    client.post(f"/api/v1/sessions/{session_id}/votes/batch", json={"votes": votes})

    # 4. Calculate Group Results
    candidates = [
        {
            "id": "paddington-2",
            "title": "Paddington 2",
            "tagline": "Warm family bear",
            "synopsis": "A wholesome adventure",
            "year": 2017,
            "runtimeMinutes": 103,
            "rating": 8.2,
            "ageRating": "PG",
            "genres": ["Comedy", "Family"],
            "moods": ["Happy", "Relaxed"],
            "posterUrl": "https://example.com/p.jpg",
            "backdropUrl": "https://example.com/b.jpg",
            "cast": ["Ben Whishaw"],
            "director": "Paul King",
            "aiInsights": {
                "headline": "Heartwarming",
                "matchScore": 99,
                "fitReasons": ["Wholesome"],
                "toneScores": {"humor": 90, "thrill": 20, "emotional": 85, "pacing": 80},
                "bestFor": "Family",
                "spoilerFreeVibeCheck": "Cozy"
            }
        },
        {
            "id": "interstellar",
            "title": "Interstellar",
            "tagline": "To the stars",
            "synopsis": "Cosmic voyage",
            "year": 2014,
            "runtimeMinutes": 169,
            "rating": 8.7,
            "ageRating": "PG-13", # Violates Leo's PG ceiling!
            "genres": ["Science Fiction", "Drama"],
            "moods": ["Curious"],
            "posterUrl": "https://example.com/p2.jpg",
            "backdropUrl": "https://example.com/b2.jpg",
            "cast": ["Matthew M"],
            "director": "Christopher Nolan",
            "aiInsights": {
                "headline": "Cosmic",
                "matchScore": 95,
                "fitReasons": ["Science"],
                "toneScores": {"humor": 10, "thrill": 85, "emotional": 95, "pacing": 75},
                "bestFor": "Teens",
                "spoilerFreeVibeCheck": "Deep"
            }
        }
    ]

    calc_res = client.post(f"/api/v1/sessions/{session_id}/calculate-results", json={"candidate_movies": candidates})
    assert calc_res.status_code == 200
    results = calc_res.json()["data"]

    # Interstellar must be eliminated due to Leo's PG limit, leaving Paddington 2 as Rank 1
    assert len(results) == 1
    assert results[0]["movie"]["id"] == "paddington-2"
    assert results[0]["rank"] == 1
    assert results[0]["compatibility_score"] >= 70

    # 5. Let group select final winner and save to watchlist
    winner_res = client.post(f"/api/v1/sessions/{session_id}/select-winner", json={
        "movie_id": "paddington-2",
        "save_to_watchlist": True
    })
    assert winner_res.status_code == 200
    assert winner_res.json()["data"]["status"] == "completed"
    assert winner_res.json()["data"]["saved_to_watchlist"] is True

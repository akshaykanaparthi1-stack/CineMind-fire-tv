def test_watchlist_lifecycle(client):
    # 1. Get initial watchlist
    res = client.get("/api/v1/watchlist")
    assert res.status_code == 200
    initial_items = res.json()["data"]
    initial_count = len(initial_items)

    # 2. Add movie to watchlist
    new_item = {
        "profile_id": "dad",
        "movie_id": "interstellar",
        "movie_title": "Interstellar",
        "poster_url": "https://example.com/p.jpg",
        "age_rating": "PG-13",
        "runtime_minutes": 169
    }
    add_res = client.post("/api/v1/watchlist", json=new_item)
    assert add_res.status_code == 200
    assert add_res.json()["success"] is True
    assert add_res.json()["data"]["movie_id"] == "interstellar"

    # 3. Toggle watched
    patch_res = client.patch("/api/v1/watchlist/dad/interstellar", json={"watched": True})
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["watched"] is True

    # 4. Remove from watchlist
    del_res = client.delete("/api/v1/watchlist/dad/interstellar")
    assert del_res.status_code == 200
    assert del_res.json()["data"]["removed"] is True

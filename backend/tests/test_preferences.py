def test_get_profiles(client):
    response = client.get("/api/v1/profiles")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert len(json_data["data"]) >= 5
    ids = [p["id"] for p in json_data["data"]]
    assert "dad" in ids
    assert "leo" in ids

def test_get_profile_by_id(client):
    response = client.get("/api/v1/profiles/dad")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["data"]["id"] == "dad"
    assert json_data["data"]["role"] == "Parent"

def test_update_preferences(client):
    payload = {
        "preferred_language": "English",
        "max_runtime_minutes": 135,
        "avoid_violence": True
    }
    response = client.put("/api/v1/preferences/dad", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert json_data["data"]["max_runtime_minutes"] == 135
    assert json_data["data"]["avoid_violence"] is True

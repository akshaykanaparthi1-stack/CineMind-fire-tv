def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "healthy"
    assert "database" in json_data

def test_api_status(client):
    response = client.get("/api/v1/status")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "database_connected" in json_data["data"]
    assert json_data["data"]["version"] == "1.0.0"

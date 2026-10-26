"""
Backend Health and Readiness API Tests.
"""

import pytest
from backend.app import create_app
from backend.config import TestingConfig


@pytest.fixture
def client():
    app = create_app(TestingConfig)
    with app.test_client() as client:
        yield client


def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["status"] == "healthy"


def test_ready_endpoint(client):
    response = client.get("/api/v1/ready")
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert "is_ready" in data

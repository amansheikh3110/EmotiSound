"""
Backend SQLite Analysis History API Tests.
"""

import pytest
from backend.app import create_app
from backend.config import TestingConfig
from backend.database.repository import AnalysisRepository


@pytest.fixture
def client():
    app = create_app(TestingConfig)
    with app.test_client() as client:
        yield client


def test_history_crud_flow(client):
    repo = AnalysisRepository(TestingConfig.DATABASE_PATH)
    sample_data = {
        "filename": "unit_test_voice.wav",
        "predicted_emotion": "happy",
        "confidence": 0.85,
        "probabilities": {"happy": 0.85, "neutral": 0.15},
        "audio_metadata": {
            "original_duration": 3.4,
            "processed_duration": 4.0,
            "was_padded": True,
            "was_truncated": False,
        },
        "model_info": {"version": "1.0.0"},
    }
    saved = repo.save_analysis(sample_data)
    record_id = saved["id"]

    # Retrieve history list
    res = client.get("/api/v1/history")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert any(item["id"] == record_id for item in data["data"]["items"])

    # Retrieve specific record
    res_single = client.get(f"/api/v1/history/{record_id}")
    assert res_single.status_code == 200
    assert res_single.get_json()["data"]["predicted_emotion"] == "happy"

    # Delete record
    res_del = client.delete(f"/api/v1/history/{record_id}")
    assert res_del.status_code == 200

    # Verify deleted
    res_after = client.get(f"/api/v1/history/{record_id}")
    assert res_after.status_code == 404

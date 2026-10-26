"""
Backend Inference and Model API Tests.
"""

from io import BytesIO
import pytest
import soundfile as sf
import numpy as np
from backend.app import create_app
from backend.config import TestingConfig
from ml.config import SAMPLE_RATE


@pytest.fixture
def client():
    app = create_app(TestingConfig)
    with app.test_client() as client:
        yield client


def test_model_info_endpoint(client):
    response = client.get("/api/v1/model")
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert "model_name" in data["data"]
    assert len(data["data"]["supported_classes"]) == 8


def test_invalid_upload_handling(client):
    # Missing file upload
    response = client.post("/api/v1/analyze")
    assert response.status_code == 400


def test_successful_inference_on_synthetic_wav(client):
    # Generate 3.0s synthetic WAV in memory
    duration = 3.0
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    wave = 0.5 * np.sin(2 * np.pi * 440 * t)  # 440 Hz tone
    buf = BytesIO()
    sf.write(buf, wave, SAMPLE_RATE, format="WAV")
    buf.seek(0)

    response = client.post(
        "/api/v1/analyze",
        data={"file": (buf, "test_audio.wav")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    res = data["data"]
    assert "predicted_emotion" in res
    assert "probabilities" in res
    assert len(res["probabilities"]) == 8
    assert res["confidence"] > 0

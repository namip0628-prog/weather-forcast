from unittest.mock import patch

import pytest

from backend.app import POPULAR_CITIES, build_forecast, determine_mood, get_weather_by_city


def test_determine_mood_for_sunny_weather():
    assert determine_mood("clear sky") == "Energetic"
    assert determine_mood("few clouds") == "Calm"
    assert determine_mood("light rain") == "Cozy"
    assert determine_mood("snow") == "Peaceful"


def test_build_forecast_creates_mood_trend():
    sample = [
        {"dt_txt": "2026-09-10 12:00:00", "main": {"temp": 30}, "weather": [{"description": "clear sky"}]},
        {"dt_txt": "2026-09-11 12:00:00", "main": {"temp": 18}, "weather": [{"description": "rain"}]},
    ]
    forecast = build_forecast(sample)

    assert len(forecast) == 2
    assert forecast[0]["mood"] == "Energetic"
    assert forecast[1]["mood"] == "Cozy"


def test_get_weather_by_city_requires_api_key(monkeypatch):
    import backend.app as app_module

    monkeypatch.setattr(app_module, "API_KEY", None)

    with pytest.raises(ValueError, match="API key"):
        app_module.get_weather_by_city("London")


def test_get_weather_by_city_reports_invalid_api_key(monkeypatch):
    import backend.app as app_module

    monkeypatch.setattr(app_module, "API_KEY", "bad-key")

    with patch("backend.app.requests.get") as mock_get:
        mock_get.return_value.status_code = 401
        mock_get.return_value.json.return_value = {"message": "Invalid API key"}

        with pytest.raises(ValueError, match="invalid|expired"):
            app_module.get_weather_by_city("London")


def test_popular_cities_include_multiple_cities():
    assert "London" in POPULAR_CITIES
    assert "New York" in POPULAR_CITIES
    assert "Tokyo" in POPULAR_CITIES
    assert "Paris" in POPULAR_CITIES


def test_city_endpoint_returns_supported_cities():
    from backend.app import app

    client = app.test_client()
    response = client.get("/cities")

    assert response.status_code == 200
    data = response.get_json()
    assert "cities" in data
    assert "New York" in data["cities"]
    assert "London" in data["cities"]

from backend.app import determine_mood, build_forecast


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

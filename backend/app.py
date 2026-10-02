import os
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)

API_KEY = os.getenv("OPENWEATHER_API_KEY")
BASE_URL = "https://api.openweathermap.org/data/2.5"

MOOD_PATTERNS = [
    ("clear", "Energetic"),
    ("sun", "Energetic"),
    ("few clouds", "Calm"),
    ("clouds", "Calm"),
    ("rain", "Cozy"),
    ("drizzle", "Cozy"),
    ("storm", "Adventurous"),
    ("snow", "Peaceful"),
    ("mist", "Balanced"),
    ("fog", "Balanced"),
]


def determine_mood(description: str) -> str:
    """Map the weather description to a friendly mood label."""
    normalized = (description or "").lower().strip()
    for keyword, mood in MOOD_PATTERNS:
        if keyword in normalized:
            return mood
    return "Calm"


def build_forecast(entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Turn raw forecast data into UI-friendly mood entries."""
    forecast: List[Dict[str, Any]] = []
    for entry in entries:
        weather = (entry.get("weather") or [{}])[0]
        description = weather.get("description", "Clear")
        temperature = entry.get("main", {}).get("temp")
        dt_text = entry.get("dt_txt")
        forecast.append(
            {
                "date": dt_text,
                "temperature": round(float(temperature) - 273.15, 1) if temperature is not None else None,
                "condition": description.title(),
                "mood": determine_mood(description),
            }
        )
    return forecast


def get_weather_by_city(city: str) -> Dict[str, Any]:
    """Fetch weather for a city using the OpenWeatherMap API."""
    if not city:
        raise ValueError("A city name is required.")
    if not API_KEY:
        raise ValueError("OpenWeatherMap API key is missing. Set OPENWEATHER_API_KEY in your environment.")

    response = requests.get(
        f"{BASE_URL}/weather",
        params={
            "q": city,
            "appid": API_KEY,
            "units": "metric",
        },
        timeout=10,
    )

    if response.status_code == 401:
        message = (response.json() or {}).get("message", "")
        if "invalid" in message.lower() or "expired" in message.lower():
            raise ValueError("OpenWeatherMap API key is invalid or expired.")
        raise ValueError("OpenWeatherMap API key is invalid.")
    if response.status_code == 404:
        raise ValueError(f"City '{city}' was not found.")
    if response.status_code != 200:
        raise ValueError("Could not fetch weather for that location.")

    payload = response.json()
    weather = (payload.get("weather") or [{}])[0]
    main = payload.get("main", {})
    return {
        "city": payload.get("name", city),
        "temperature": round(float(main.get("temp", 0)), 1),
        "condition": weather.get("description", "Clear").title(),
        "mood": determine_mood(weather.get("description", "clear")),
    }


def get_weather_by_coordinates(lat: float, lon: float) -> Dict[str, Any]:
    """Fetch weather for coordinates."""
    if not API_KEY:
        raise ValueError("OpenWeatherMap API key is missing. Set OPENWEATHER_API_KEY in your environment.")

    response = requests.get(
        f"{BASE_URL}/weather",
        params={
            "lat": lat,
            "lon": lon,
            "appid": API_KEY,
            "units": "metric",
        },
        timeout=10,
    )

    if response.status_code == 401:
        message = (response.json() or {}).get("message", "")
        if "invalid" in message.lower() or "expired" in message.lower():
            raise ValueError("OpenWeatherMap API key is invalid or expired.")
        raise ValueError("OpenWeatherMap API key is invalid.")
    if response.status_code != 200:
        raise ValueError("Unable to determine the weather at your current location.")

    payload = response.json()
    weather = (payload.get("weather") or [{}])[0]
    main = payload.get("main", {})
    return {
        "city": payload.get("name", "Your Location"),
        "temperature": round(float(main.get("temp", 0)), 1),
        "condition": weather.get("description", "Clear").title(),
        "mood": determine_mood(weather.get("description", "clear")),
    }


def get_forecast(city: Optional[str] = None, lat: Optional[float] = None, lon: Optional[float] = None) -> List[Dict[str, Any]]:
    """Fetch the 5-day forecast and add mood labels for each item."""
    if not API_KEY:
        raise ValueError("OpenWeatherMap API key is missing. Set OPENWEATHER_API_KEY in your environment.")

    params = {"appid": API_KEY, "units": "metric", "cnt": 5}
    if city:
        params["q"] = city
    elif lat is not None and lon is not None:
        params["lat"] = lat
        params["lon"] = lon
    else:
        raise ValueError("City or coordinates are required.")

    response = requests.get(f"{BASE_URL}/forecast", params=params, timeout=10)
    if response.status_code == 401:
        message = (response.json() or {}).get("message", "")
        if "invalid" in message.lower() or "expired" in message.lower():
            raise ValueError("OpenWeatherMap API key is invalid or expired.")
        raise ValueError("OpenWeatherMap API key is invalid.")
    if response.status_code != 200:
        raise ValueError("The forecast could not be loaded.")

    payload = response.json()
    entries = (payload.get("list") or [])[:5]
    return build_forecast(entries)


@app.route("/weather", methods=["GET"])
def weather_route() -> Any:
    """Public endpoint used by the React frontend."""
    if not API_KEY:
        return jsonify({"error": "OpenWeatherMap API key is missing. Set OPENWEATHER_API_KEY in your environment."}), 500

    city = request.args.get("city", "").strip()
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)

    try:
        if city:
            current = get_weather_by_city(city)
        elif lat is not None and lon is not None:
            current = get_weather_by_coordinates(lat, lon)
        else:
            return jsonify({"error": "Please provide a city name or location coordinates."}), 400

        forecast = get_forecast(city=city or None, lat=lat, lon=lon)
        return jsonify({**current, "forecast": forecast}), 200
    except ValueError as exc:
        message = str(exc).lower()
        status = 404 if "not found" in message or "required" in message else 400
        return jsonify({"error": str(exc)}), status


@app.route("/health", methods=["GET"])
def health_check() -> Any:
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

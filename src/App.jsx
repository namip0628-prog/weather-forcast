import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const moodThemes = {
  Energetic: { background: 'linear-gradient(135deg, #ffd86b 0%, #ff9a5a 100%)', accent: '#fff4d2' },
  Calm: { background: 'linear-gradient(135deg, #cfe4ff 0%, #7bb6d9 100%)', accent: '#edf6ff' },
  Cozy: { background: 'linear-gradient(135deg, #7bc2d9 0%, #324e75 100%)', accent: '#dfeaf7' },
  Peaceful: { background: 'linear-gradient(135deg, #dff5ff 0%, #98c6dd 100%)', accent: '#f1fbff' },
  Balanced: { background: 'linear-gradient(135deg, #d9fbe2 0%, #7cc6a3 100%)', accent: '#eefef4' },
  Adventurous: { background: 'linear-gradient(135deg, #ffc29f 0%, #dd7864 100%)', accent: '#fff0eb' },
};

function App() {
  const [city, setCity] = useState('London');
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchWeather = useCallback(async (cityName, lat, lon) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get('/weather', {
        params: {
          city: cityName || undefined,
          lat: lat ?? undefined,
          lon: lon ?? undefined,
        },
      });

      const payload = response?.data;
      if (!payload || typeof payload !== 'object' || payload.error || !payload.city) {
        setWeather(null);
        setError(typeof payload?.error === 'string' ? payload.error : 'Something went wrong while fetching the weather.');
        return;
      }

      setWeather(payload);
      setCity(payload.city || cityName || 'Your location');
    } catch (err) {
      const payload = err?.response?.data;
      const message = typeof payload?.error === 'string'
        ? payload.error
        : typeof payload?.message === 'string'
          ? payload.message
          : 'Something went wrong while fetching the weather.';

      setError(message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather('London');
  }, [fetchWeather]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!city.trim()) {
      setError('Please enter a city name.');
      return;
    }
    fetchWeather(city.trim());
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchWeather('', latitude, longitude);
      },
      () => {
        setLoading(false);
        setError('Location access was denied. Try searching by city instead.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const mood = weather?.mood || 'Balanced';
  const theme = moodThemes[mood] || moodThemes.Balanced;

  return (
    <main className="app-shell" style={{ background: theme.background }}>
      <section className="weather-card">
        <div className="topbar">
          <div>
            <p className="eyebrow">Weather Mood</p>
            <h1>How does the sky feel today?</h1>
          </div>
        </div>

        <form className="searchbar" onSubmit={handleSubmit}>
          <input
            type="text"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Search for a city"
            aria-label="City name"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Check Weather'}
          </button>
          <button type="button" className="secondary" onClick={handleUseLocation}>
            Use my location
          </button>
        </form>

        {error && <div className="error-box">{error}</div>}

        {weather && (
          <div className="result-panel">
            <div className="header-row">
              <div>
                <p className="label">Location</p>
                <h2>{weather.city}</h2>
              </div>
              <span className="mood-pill" style={{ background: theme.accent, color: '#1f2c3d' }}>
                {mood}
              </span>
            </div>

            <div className="stats-grid">
              <div className="stat-box">
                <span className="label">Temperature</span>
                <strong>{weather.temperature}°C</strong>
              </div>
              <div className="stat-box">
                <span className="label">Condition</span>
                <strong>{weather.condition}</strong>
              </div>
              <div className="stat-box full-width">
                <span className="label">Mood Forecast</span>
                <strong>{weather.mood}</strong>
              </div>
            </div>

            <div className="forecast-box">
              <h3>5-Day Mood Trend</h3>
              <div className="forecast-list">
                {weather.forecast?.map((item) => (
                  <div key={`${item.date}-${item.condition}`} className="forecast-item">
                    <span>{new Date(item.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                    <strong>{item.mood}</strong>
                    <small>{item.temperature}°C • {item.condition}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;

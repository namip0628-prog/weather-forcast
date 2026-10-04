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
  const [popularCities, setPopularCities] = useState(['London', 'New York', 'Tokyo', 'Paris', 'Dubai']);
  const [favorites, setFavorites] = useState(() => {
    if (typeof window === 'undefined') return ['London'];
    try {
      const saved = JSON.parse(window.localStorage.getItem('weather-favorites') || '[]');
      return Array.isArray(saved) && saved.length ? saved : ['London'];
    } catch {
      return ['London'];
    }
  });
  const [searchHistory, setSearchHistory] = useState(() => {
    if (typeof window === 'undefined') return ['London'];
    try {
      const saved = JSON.parse(window.localStorage.getItem('weather-history') || '[]');
      return Array.isArray(saved) && saved.length ? saved : ['London'];
    } catch {
      return ['London'];
    }
  });
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('weather-theme') === 'dark';
  });

  const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
  const weatherEndpoint = apiBaseUrl ? `${apiBaseUrl}/weather` : '/weather';
  const citiesEndpoint = apiBaseUrl ? `${apiBaseUrl}/cities` : '/cities';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('weather-favorites', JSON.stringify(favorites));
    }
  }, [favorites]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('weather-history', JSON.stringify(searchHistory));
    }
  }, [searchHistory]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('weather-theme', darkMode ? 'dark' : 'light');
    }
  }, [darkMode]);

  const addToHistory = useCallback((value) => {
    const trimmed = value?.trim();
    if (!trimmed) return;
    setSearchHistory((previous) => [
      trimmed,
      ...previous.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, 5));
  }, []);

  const fetchWeather = useCallback(async (cityName, lat, lon) => {
    const targetCity = cityName?.trim();
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(weatherEndpoint, {
        params: {
          city: targetCity || undefined,
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
      if (targetCity) addToHistory(targetCity);
      setCity(payload.city || targetCity || 'Your location');
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
  }, [addToHistory, weatherEndpoint]);

  useEffect(() => {
    axios.get(citiesEndpoint)
      .then((response) => {
        const cities = Array.isArray(response?.data?.cities) ? response.data.cities : ['London', 'New York', 'Tokyo', 'Paris', 'Dubai'];
        setPopularCities(cities);
      })
      .catch(() => {
        setPopularCities(['London', 'New York', 'Tokyo', 'Paris', 'Dubai']);
      });

    fetchWeather('London');
  }, [citiesEndpoint, fetchWeather]);

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

  const toggleFavorite = (favoriteCity) => {
    setFavorites((previous) => {
      const exists = previous.some((item) => item.toLowerCase() === favoriteCity.toLowerCase());
      if (exists) {
        return previous.filter((item) => item.toLowerCase() !== favoriteCity.toLowerCase());
      }
      return [favoriteCity, ...previous].slice(0, 5);
    });
  };

  const mood = weather?.mood || 'Balanced';
  const theme = moodThemes[mood] || moodThemes.Balanced;
  const hourlyForecast = weather?.hourly || [];

  return (
    <main className={darkMode ? 'app-shell dark' : 'app-shell'} style={{ background: darkMode ? '#1f2c30' : theme.background }}>
      <section className="weather-card">
        <div className="topbar">
          <div>
            <p className="eyebrow">Weather Mood</p>
            <h1>How does the sky feel today?</h1>
          </div>
          <button type="button" className="theme-toggle" onClick={() => setDarkMode((current) => !current)}>
            {darkMode ? 'Light mode' : 'Dark mode'}
          </button>
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

        <div className="chip-row">
          <span className="chip-label">Popular</span>
          <div className="city-pills" aria-label="Popular cities">
            {popularCities.map((popularCity) => (
              <button
                key={popularCity}
                type="button"
                className={popularCity === city ? 'chip active' : 'chip'}
                onClick={() => {
                  setCity(popularCity);
                  fetchWeather(popularCity);
                }}
              >
                {popularCity}
              </button>
            ))}
          </div>
        </div>

        <div className="meta-row">
          <div className="meta-group">
            <span className="chip-label">Favorites</span>
            <div className="inline-pills">
              {favorites.map((favoriteCity) => (
                <button key={favoriteCity} type="button" className="chip small" onClick={() => fetchWeather(favoriteCity)}>
                  {favoriteCity}
                </button>
              ))}
            </div>
          </div>
          <div className="meta-group">
            <span className="chip-label">Recent</span>
            <div className="inline-pills">
              {searchHistory.map((historyCity) => (
                <button key={historyCity} type="button" className="chip small" onClick={() => fetchWeather(historyCity)}>
                  {historyCity}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}

        {weather && (
          <div className="result-panel">
            <div className="header-row">
              <div>
                <p className="label">Location</p>
                <h2>{weather.city}</h2>
              </div>
              <div className="detail-actions">
                <button type="button" className="favorite-button" onClick={() => toggleFavorite(weather.city)}>
                  {favorites.some((item) => item.toLowerCase() === weather.city.toLowerCase()) ? '★ Saved' : '☆ Save'}
                </button>
                <span className="mood-pill" style={{ background: theme.accent, color: '#1f2c3d' }}>
                  {mood}
                </span>
              </div>
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

            <div className="hourly-box">
              <h3>Upcoming Hours</h3>
              <div className="hourly-list">
                {hourlyForecast.map((item) => (
                  <div key={`${weather.city}-${item.time}`} className="hourly-item">
                    <span>{item.time}</span>
                    <strong>{item.mood}</strong>
                    <small>{item.temperature}°C</small>
                  </div>
                ))}
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

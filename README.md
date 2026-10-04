# Weather Mood

LIVE DEMO: https://weather-forcast-front.onrender.com/

A weather dashboard that pairs current conditions with mood labels and a short forecast trend. The React frontend uses a Flask backend to query the OpenWeatherMap API.

## Requirements

- Node.js and npm
- Python 3.9 or newer
- An OpenWeatherMap API key

## Setup

1. Install the Python dependencies in a virtual environment:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

   On macOS or Linux, activate it with `source .venv/bin/activate` instead.

2. Install the frontend dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file from `.env.example` and set your OpenWeatherMap API key:

   ```text
   OPENWEATHER_API_KEY=your_api_key_here
   ```

   Keep `.env` private; it is excluded from Git.

## Run locally

With the Python virtual environment active, start both the Flask backend and Vite frontend:

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The frontend runs on port 5173 and proxies weather requests to the backend on port 5000.

## Tests and build

Run the backend tests:

```sh
python -m pytest -q
```

Create a production frontend build:

```sh
npm run build
```

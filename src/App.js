import { initializeApp } from "firebase/app";
import { getDatabase, onValue, ref } from "firebase/database";
import {
  Activity,
  Cloud,
  Droplets,
  Gauge,
  MapPin,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./App.css"; // Make sure to import the CSS file

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOurbIXix496G-1lzb79CzGrSa7zIE_WI",
  authDomain: "smart-agriculture-cac24.firebaseapp.com",
  databaseURL: "https://smart-agriculture-cac24-default-rtdb.firebaseio.com",
  projectId: "smart-agriculture-cac24",
  storageBucket: "smart-agriculture-cac24.firebaseapp.com",
  messagingSenderId: "81605854927",
  appId: "1:81605854927:web:16b9e825387d420c5899ba",
  measurementId: "G-VV4KGLDKWD",
};

// OpenWeather API configuration
const WEATHER_API_KEY = "cd89284ec03c5f69a4dd8ae69721e89e"; // Replace with your API key
const CITY = "Chennai,IN"; // Replace with your location e.g., "London,uk"
const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&units=metric&appid=${WEATHER_API_KEY}`;

function App() {
  // State for sensor data
  const [currentData, setCurrentData] = useState({
    temperature: 0,
    humidity: 0,
    soilMoisture: 0,
    pumpStatus: "OFF",
  });

  const [historicalData, setHistoricalData] = useState([]);

  // State for weather data
  const [weatherData, setWeatherData] = useState(null);
  const [weatherForecast, setWeatherForecast] = useState([]);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);

  // Fetch agriculture sensor data from Firebase
  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    const agricultureRef = ref(database, "agriculture");

    onValue(agricultureRef, (snapshot) => {
      const val = snapshot.val();
      console.log("Firebase Data:", val);

      if (val) {
        setCurrentData(val);

        // Add timestamp to data for charts
        const timestamp = new Date().toLocaleTimeString();
        setHistoricalData((prevData) => {
          // Keep only the last 20 data points
          const newData = [...prevData, { ...val, timestamp }].slice(-20);
          return newData;
        });
      }
    });
  }, []);

  // Fetch weather data from OpenWeather API
  useEffect(() => {
    const fetchWeatherData = async () => {
      setIsWeatherLoading(true);
      try {
        const response = await fetch(WEATHER_API_URL);
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }
        const data = await response.json();

        // Process current weather
        if (data && data.list && data.list.length > 0) {
          setWeatherData(data.list[0]);

          // Process forecast data (one entry per day)
          const dailyForecasts = [];
          const today = new Date().getDate();

          // Filter to get one forecast per day (at noon)
          data.list.forEach((forecast) => {
            const forecastDate = new Date(forecast.dt * 1000);
            const forecastDay = forecastDate.getDate();
            const forecastHour = forecastDate.getHours();

            // Only take forecasts for future days (not today) at around noon
            if (
              forecastDay !== today &&
              forecastHour >= 11 &&
              forecastHour <= 13
            ) {
              dailyForecasts.push(forecast);
            }
          });

          // Limit to 5 days
          setWeatherForecast(dailyForecasts.slice(0, 5));
        }
      } catch (error) {
        console.error("Failed to fetch weather data:", error);
      } finally {
        setIsWeatherLoading(false);
      }
    };

    fetchWeatherData();

    // Refresh weather data every 30 minutes
    const weatherInterval = setInterval(fetchWeatherData, 30 * 60 * 1000);
    return () => clearInterval(weatherInterval);
  }, []);

  // Convert weather condition code to appropriate icon
  const getWeatherIcon = (conditionCode) => {
    // Weather condition codes: https://openweathermap.org/weather-conditions
    if (!conditionCode) return <Cloud size={32} />;

    // First digit defines condition category
    const mainCode = Math.floor(conditionCode / 100);

    switch (mainCode) {
      case 2: // Thunderstorm
        return <Cloud size={32} className="weather-icon storm" />;
      case 3: // Drizzle
      case 5: // Rain
        return <Umbrella size={32} className="weather-icon rain" />;
      case 6: // Snow
        return <Cloud size={32} className="weather-icon snow" />;
      case 7: // Atmosphere (fog, mist, etc.)
        return <Cloud size={32} className="weather-icon fog" />;
      case 8:
        // 800 is clear, 80x is clouds
        return conditionCode === 800 ? (
          <Sun size={32} className="weather-icon sun" />
        ) : (
          <Cloud size={32} className="weather-icon cloud" />
        );
      default:
        return <Cloud size={32} />;
    }
  };

  // Format date for forecast display
  const formatForecastDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="app-container">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-content">
            <h1 className="dashboard-title">🌾 Smart Agriculture Dashboard</h1>
            <div className="last-updated">
              Last Updated: {new Date().toLocaleString()}
            </div>
          </div>
        </header>

        {/* Weather Section */}
        <section className="weather-section">
          <h2 className="section-title">Weather Report</h2>

          {isWeatherLoading ? (
            <div className="loading-container">Loading weather data...</div>
          ) : weatherData ? (
            <div className="weather-content">
              {/* Current Weather */}
              <div className="current-weather">
                <div className="weather-main">
                  {getWeatherIcon(weatherData?.weather?.[0]?.id)}
                  <div className="weather-temp">
                    {Math.round(weatherData?.main?.temp)}°C
                  </div>
                  <div className="weather-desc">
                    {weatherData?.weather?.[0]?.description}
                  </div>
                </div>

                <div className="weather-details">
                  <div className="weather-detail">
                    <MapPin className="icon weather-icon" size={18} />
                    <span>Location: {CITY}</span>
                  </div>
                  <div className="weather-detail">
                    <Droplets className="icon weather-icon" size={18} />
                    <span>Humidity: {weatherData?.main?.humidity}%</span>
                  </div>
                  <div className="weather-detail">
                    <Wind className="icon weather-icon" size={18} />
                    <span>
                      Wind: {Math.round(weatherData?.wind?.speed * 3.6)} km/h
                    </span>
                  </div>
                  <div className="weather-detail">
                    <Umbrella className="icon weather-icon" size={18} />
                    <span>
                      Precipitation: {weatherData?.rain?.["3h"] || 0} mm
                    </span>
                  </div>
                </div>
              </div>

              {/* Weather Forecast */}
              <div className="weather-forecast">
                {weatherForecast.map((forecast, index) => (
                  <div key={index} className="forecast-day">
                    <div className="forecast-date">
                      {formatForecastDate(forecast.dt)}
                    </div>
                    <div className="forecast-icon">
                      {getWeatherIcon(forecast?.weather?.[0]?.id)}
                    </div>
                    <div className="forecast-temp">
                      {Math.round(forecast?.main?.temp)}°C
                    </div>
                    <div className="forecast-desc">
                      {forecast?.weather?.[0]?.main}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="error-container">Unable to load weather data</div>
          )}
        </section>

        {/* Current Readings Cards */}
        <h2 className="section-title">Current Sensor Readings</h2>
        <div className="metrics-grid">
          <div className="metric-card temperature-card">
            <div className="metric-header">
              <Thermometer className="icon temperature-icon" size={24} />
              <h2 className="metric-title">Temperature</h2>
            </div>
            <p className="metric-value temperature-value">
              {currentData?.temperature ?? "Loading..."}°C
            </p>
          </div>

          <div className="metric-card humidity-card">
            <div className="metric-header">
              <Droplets className="icon humidity-icon" size={24} />
              <h2 className="metric-title">Humidity</h2>
            </div>
            <p className="metric-value humidity-value">
              {currentData?.humidity ?? "Loading..."}%
            </p>
          </div>

          <div className="metric-card soil-card">
            <div className="metric-header">
              <Gauge className="icon soil-icon" size={24} />
              <h2 className="metric-title">Soil Moisture</h2>
            </div>
            <p className="metric-value soil-value">
              {currentData?.soilMoisture ?? "Loading..."}
            </p>
          </div>

          <div className="metric-card pump-card">
            <div className="metric-header">
              <Activity className="icon pump-icon" size={24} />
              <h2 className="metric-title">Pump Status</h2>
            </div>
            <div className="pump-status">
              <div
                className={`status-indicator ${
                  currentData?.pumpStatus === "ON" ? "status-on" : "status-off"
                }`}
              ></div>
              <p className="metric-value">
                {currentData?.pumpStatus ?? "Loading..."}
              </p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <h2 className="section-title">Sensor Data Trends</h2>
        <div className="charts-grid">
          {/* Temperature Chart */}
          <div className="chart-card">
            <h2 className="chart-title">Temperature Trend</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#EF4444"
                    activeDot={{ r: 8 }}
                    name="Temperature (°C)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Humidity Chart */}
          <div className="chart-card">
            <h2 className="chart-title">Humidity Trend</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="#3B82F6"
                    activeDot={{ r: 8 }}
                    name="Humidity (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Soil Moisture Chart */}
          <div className="chart-card">
            <h2 className="chart-title">Soil Moisture Trend</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="soilMoisture"
                    stroke="#10B981"
                    activeDot={{ r: 8 }}
                    name="Soil Moisture"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Combined Chart */}
          <div className="chart-card">
            <h2 className="chart-title">All Parameters</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#EF4444"
                    activeDot={{ r: 8 }}
                    name="Temperature (°C)"
                  />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="#3B82F6"
                    name="Humidity (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="soilMoisture"
                    stroke="#10B981"
                    name="Soil Moisture"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <footer className="dashboard-footer">
          Smart Agriculture Monitoring System © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}

export default App;
